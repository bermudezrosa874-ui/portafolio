// IMPORTANTE: este módulo debe importarse ANTES que lib/supabase. El cliente de Supabase borra el
// hash de la URL (#access_token=…&type=invite) al procesarlo; aquí se guarda lo que traía.

const hash = typeof window !== 'undefined' ? window.location.hash : ''

/** Si el visitante llegó desde un enlace de invitación o de recuperación de contraseña. */
export const ARRIVED_TYPE: 'invite' | 'recovery' | null = /(^|[#&])type=invite/.test(hash)
  ? 'invite'
  : /(^|[#&])type=recovery/.test(hash)
    ? 'recovery'
    : null

/** Mensaje de error que Supabase deja en el hash (por ejemplo, enlace vencido). */
export const ARRIVED_ERROR: string | null = (() => {
  const m = hash.match(/error_description=([^&]+)/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1].replace(/\+/g, ' '))
  } catch {
    return null
  }
})()
