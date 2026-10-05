import { useCallback, useEffect, useState } from 'react'
import { THEME_KEY, readFlag, writeFlag } from '../lib/safeStorage'

export type Theme = 'dark' | 'light'

export function initialTheme(): Theme {
  return readFlag(THEME_KEY) === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeFlag(THEME_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
