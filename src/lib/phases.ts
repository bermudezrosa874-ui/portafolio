import type { Phase } from '../types'

type WithOpening = Pick<Phase, 'opens_at'>

/** Fecha de hoy en Bogotá (AAAA-MM-DD): una fase abre ese día a las 00:00, hora de Colombia. */
export function todayBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

/** La fase todavía no abre: no se muestra su contenido ni se puede subir ni escribir nada. */
export function isPhaseLocked(phase: WithOpening | null | undefined): boolean {
  return !!phase?.opens_at && phase.opens_at > todayBogota()
}

/** «26 de octubre», o null si la fase no tiene fecha de apertura. */
export function opensOn(phase: WithOpening | null | undefined): string | null {
  if (!phase?.opens_at) return null
  return new Date(`${phase.opens_at}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

/** Fases ya abiertas, en el mismo orden. */
export const openPhases = <T extends WithOpening>(phases: T[]): T[] => phases.filter((p) => !isPhaseLocked(p))
