// localStorage puede fallar (ventana privada, datos bloqueados): todo va en try/catch.

export function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeFlag(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sin almacenamiento: la app sigue funcionando */
  }
}

export function removeFlag(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* sin almacenamiento: la app sigue funcionando */
  }
}

export const INTRO_KEY = 'abaco-intro-visto'
export const THEME_KEY = 'abaco-tema'
