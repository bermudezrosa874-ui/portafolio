import { useEffect } from 'react'
import { writeFlag } from '../lib/safeStorage'
import { useToast } from '../components/ui/Toast'

export const IDLE_FLAG = 'abaco-sesion-inactiva'
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const

/** Cierra la sesión tras `minutes` sin actividad y avisa un minuto antes. */
export function useIdleLogout(active: boolean, minutes = 30) {
  const toast = useToast()

  useEffect(() => {
    if (!active) return
    let warn = 0
    let out = 0

    const reset = () => {
      window.clearTimeout(warn)
      window.clearTimeout(out)
      warn = window.setTimeout(
        () => toast('info', 'Tu sesión se cerrará en 1 minuto por inactividad. Mueve el mouse o toca la pantalla para continuar.'),
        (minutes - 1) * 60_000,
      )
      out = window.setTimeout(() => {
        writeFlag(IDLE_FLAG, '1')
        void import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut())
      }, minutes * 60_000)
    }

    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      window.clearTimeout(warn)
      window.clearTimeout(out)
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [active, minutes, toast])
}
