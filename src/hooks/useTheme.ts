import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { THEME_KEY, readFlag, writeFlag } from '../lib/safeStorage'

export type Theme = 'dark' | 'light'

export function initialTheme(): Theme {
  // El portafolio abre en claro; solo queda en oscuro si la persona lo eligió con el botón de tema.
  return readFlag(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

// Un solo estado compartido: todos los botones de tema (portafolio, panel de la administradora, colaboradores,
// inicio de sesión) se mantienen sincronizados y el cambio se recuerda entre páginas.
let current: Theme = initialTheme()
const listeners = new Set<() => void>()

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    current = current === 'dark' ? 'light' : 'dark'
    writeFlag(THEME_KEY, current)
    listeners.forEach((l) => l())
  }, [])
  return { theme, toggle }
}
