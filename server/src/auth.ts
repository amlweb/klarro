import type { NextFunction, Request, Response } from 'express'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { supabaseForUser } from './supabase.js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      db?: SupabaseClient
    }
  }
}

/** Checks the "Authorization: Bearer <token>" header sent by the web app. */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    res.status(401).json({ error: 'Missing access token' })
    return
  }

  const db = supabaseForUser(token)
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = data.user
  req.db = db
  next()
}
