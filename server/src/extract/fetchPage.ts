import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import * as cheerio from 'cheerio'

/** An error whose message is safe to show to the user. */
export class FetchPageError extends Error {}

const TIMEOUT_MS = 15_000
const MAX_BYTES = 3_000_000
const MAX_REDIRECTS = 5
/** Text longer than this is cut, to keep the Claude request small. */
const MAX_TEXT_CHARS = 50_000

/**
 * Addresses the server must never fetch for a user (SSRF protection):
 * loopback, private networks, link-local (cloud metadata) and similar.
 */
const blocked = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 3],
] as const) blocked.addSubnet(net, prefix, 'ipv4')
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) blocked.addSubnet(net, prefix, 'ipv6')

function isBlockedAddress(address: string): boolean {
  // IPv4 written as IPv6, e.g. ::ffff:127.0.0.1
  const v4 = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
  if (v4) return blocked.check(v4, 'ipv4')
  return blocked.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4')
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new FetchPageError('Only http and https links are supported.')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (addresses.length === 0) throw new FetchPageError('Could not find this website.')
  if (addresses.some((a) => isBlockedAddress(a.address))) {
    throw new FetchPageError('This address is not allowed.')
  }
}

/** Downloads the page, following redirects by hand so every hop is checked. */
async function download(startUrl: string): Promise<string> {
  let url = new URL(startUrl)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url)
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KlarroBot/0.1)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pl,en;q=0.8',
      },
    }).catch((err: unknown) => {
      const timedOut = err instanceof DOMException && err.name === 'TimeoutError'
      throw new FetchPageError(timedOut ? 'The page took too long to load.' : 'Could not load the page.')
    })

    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    if (!res.ok) throw new FetchPageError(`The page answered with HTTP ${res.status}.`)

    const type = res.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml/i.test(type)) {
      throw new FetchPageError('The link is not an HTML page.')
    }
    return readLimited(res)
  }
  throw new FetchPageError('Too many redirects.')
}

async function readLimited(res: Response): Promise<string> {
  const length = Number(res.headers.get('content-length') ?? 0)
  if (length > MAX_BYTES) throw new FetchPageError('The page is too large.')
  if (!res.body) return ''

  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of res.body) {
    total += chunk.byteLength
    if (total > MAX_BYTES) throw new FetchPageError('The page is too large.')
    chunks.push(chunk)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

/** Finds schema.org JobPosting data, which many job boards embed even when the page is built with JS. */
function findJobPostings($: cheerio.CheerioAPI): unknown[] {
  const found: unknown[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      const type = obj['@type']
      if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) found.push(obj)
      else if (obj['@graph']) visit(obj['@graph'])
    }
  }
  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      visit(JSON.parse($(el).text()))
    } catch {
      // Broken JSON-LD on the page: ignore it.
    }
  })
  return found
}

/** Turns HTML into plain text with the structured JobPosting data (if any) on top. */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html)
  const postings = findJobPostings($)

  $('script, style, noscript, svg, iframe, template, nav, footer, header, form').remove()
  // Keep line breaks between blocks, so "<h1>Title</h1><p>Text</p>" does not become "TitleText".
  $('br').replaceWith('\n')
  $('p, div, li, h1, h2, h3, h4, h5, h6, tr, dt, dd, section, article').append('\n')
  const title = $('title').first().text().trim()
  const body = ($('main').length ? $('main') : $('body'))
    .text()
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

  const parts: string[] = []
  if (title) parts.push(`Page title: ${title}`)
  if (postings.length) parts.push(`Structured data (JSON-LD):\n${JSON.stringify(postings)}`)
  if (body) parts.push(`Page text:\n${body}`)
  return parts.join('\n\n').slice(0, MAX_TEXT_CHARS)
}

/** Downloads a job ad page and returns clean text for extraction. */
export async function fetchAdText(url: string): Promise<string> {
  const text = htmlToText(await download(url))
  if (text.length < 200) {
    throw new FetchPageError(
      'The page has almost no text (it may need JavaScript or a login). Please paste the ad text instead.',
    )
  }
  return text
}
