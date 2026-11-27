import { createTheme } from '@mui/material'

// One place for colours and shapes. Change these instead of styling components one by one.
export const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  palette: {
    primary: { main: '#3f51b5' },
  },
  shape: { borderRadius: 10 },
})
