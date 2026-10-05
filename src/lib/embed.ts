// Conversión de enlaces a formato incrustable + lista blanca de dominios.
// Solo https. Lo que no esté en la lista (o no tenga un formato de incrustación conocido)
// se abre en una pestaña nueva con rel="noopener noreferrer".

export const ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'drive.google.com',
  'docs.google.com',
  'genially.com',
  'canva.com',
  'prezi.com',
  'padlet.com',
  'wordwall.net',
  'liveworksheets.com',
  'mentimeter.com',
  'cdn.knightlab.com',
  'onedrive.live.com',
] as const

export type Platform =
  | 'youtube'
  | 'vimeo'
  | 'drive'
  | 'google-docs'
  | 'canva'
  | 'onedrive'
  | 'genially'
  | 'prezi'
  | 'padlet'
  | 'wordwall'
  | 'liveworksheets'
  | 'mentimeter'
  | 'timelinejs'
  | 'otro'

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  drive: 'Google Drive',
  'google-docs': 'Google Docs',
  canva: 'Canva',
  onedrive: 'OneDrive',
  genially: 'Genially',
  prezi: 'Prezi',
  padlet: 'Padlet',
  wordwall: 'Wordwall',
  liveworksheets: 'Liveworksheets',
  mentimeter: 'Mentimeter',
  timelinejs: 'TimelineJS',
  otro: 'Enlace externo',
}

export interface EmbedInfo {
  /** El texto era una URL https válida y sin credenciales. */
  valid: boolean
  /** URL normalizada para abrir en pestaña nueva (solo si es válida). */
  openUrl: string | null
  /** El dominio está en la lista blanca. */
  allowed: boolean
  platform: Platform
  /** URL para el iframe; null si no se puede incrustar con seguridad. */
  embedUrl: string | null
  thumbnail: string | null
}

const NONE: EmbedInfo = { valid: false, openUrl: null, allowed: false, platform: 'otro', embedUrl: null, thumbnail: null }

const hostMatches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

export function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase()
  return ALLOWED_DOMAINS.some((d) => hostMatches(h, d))
}

/** Defensa en profundidad: ¿esta URL puede ir dentro de un iframe? */
export function isAllowedHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && !u.username && !u.password && isAllowedHost(u.hostname)
  } catch {
    return false
  }
}

const YT_ID = /^[\w-]{11}$/

export function resolveEmbed(raw: string | null | undefined): EmbedInfo {
  if (!raw) return NONE
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return NONE
  }
  if (u.protocol !== 'https:' || u.username || u.password) return NONE

  const host = u.hostname.toLowerCase()
  const allowed = isAllowedHost(host)
  const base: EmbedInfo = { valid: true, openUrl: u.toString(), allowed, platform: 'otro', embedUrl: null, thumbnail: null }
  if (!allowed) return base

  const path = u.pathname
  const parts = path.split('/').filter(Boolean)

  // YouTube
  if (hostMatches(host, 'youtube.com') || host === 'youtu.be') {
    let id: string | undefined
    if (host === 'youtu.be') id = parts[0]
    else if (path === '/watch') id = u.searchParams.get('v') ?? undefined
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1]
    if (id && YT_ID.test(id)) {
      return {
        ...base,
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      }
    }
    return { ...base, platform: 'youtube' }
  }

  // Vimeo (vimeo.com/ID, vimeo.com/ID/HASH, player.vimeo.com/video/ID)
  if (hostMatches(host, 'vimeo.com')) {
    const idx = host.startsWith('player.') ? 1 : 0
    const id = parts[idx]
    const hash = parts[idx + 1] ?? u.searchParams.get('h') ?? undefined
    if (id && /^\d+$/.test(id)) {
      const qs = hash && /^[\w]+$/.test(hash) ? `?h=${hash}` : ''
      return { ...base, platform: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}${qs}` }
    }
    return { ...base, platform: 'vimeo' }
  }

  // Google Drive (archivos)
  if (host === 'drive.google.com') {
    let id: string | undefined
    if (parts[0] === 'file' && parts[1] === 'd') id = parts[2]
    else if (path === '/open') id = u.searchParams.get('id') ?? undefined
    if (id && /^[\w-]+$/.test(id)) {
      return { ...base, platform: 'drive', embedUrl: `https://drive.google.com/file/d/${id}/preview` }
    }
    return { ...base, platform: 'drive' }
  }

  // Google Docs / Presentaciones / Hojas / Formularios
  if (host === 'docs.google.com') {
    const kind = parts[0]
    if (kind === 'forms') {
      const out = new URL(u.toString())
      out.searchParams.set('embedded', 'true')
      return { ...base, platform: 'google-docs', embedUrl: out.toString() }
    }
    if (['document', 'spreadsheets', 'presentation'].includes(kind) && parts[1] === 'd') {
      const published = parts[2] === 'e'
      const id = published ? parts[3] : parts[2]
      if (id && /^[\w-]+$/.test(id)) {
        const root = `https://docs.google.com/${kind}/d/${published ? 'e/' : ''}${id}`
        const embedUrl =
          kind === 'presentation' ? `${root}/embed` : published ? `${root}/pub?embedded=true` : `${root}/preview`
        return { ...base, platform: 'google-docs', embedUrl }
      }
    }
    return { ...base, platform: 'google-docs' }
  }

  // Canva: /design/<id>/<token>/(view|edit|watch)
  if (hostMatches(host, 'canva.com')) {
    if (parts[0] === 'design' && parts.length >= 3) {
      const modeIdx = parts.findIndex((p, i) => i >= 2 && ['view', 'edit', 'watch'].includes(p))
      const id = parts.slice(1, modeIdx === -1 ? parts.length : modeIdx).join('/')
      if (id && /^[\w/-]+$/.test(id)) {
        return { ...base, platform: 'canva', embedUrl: `https://www.canva.com/design/${id}/view?embed` }
      }
    }
    return { ...base, platform: 'canva' }
  }

  // OneDrive
  if (host === 'onedrive.live.com') {
    if (path.includes('/embed')) return { ...base, platform: 'onedrive', embedUrl: u.toString() }
    if (path.includes('/view.aspx')) {
      const out = new URL(u.toString())
      out.pathname = path.replace('/view.aspx', '/embed')
      return { ...base, platform: 'onedrive', embedUrl: out.toString() }
    }
    return { ...base, platform: 'onedrive' }
  }

  // Genially (view.genially.com/<id>)
  if (hostMatches(host, 'genially.com')) {
    if (host === 'view.genially.com' && parts.length >= 1) {
      return { ...base, platform: 'genially', embedUrl: u.toString() }
    }
    return { ...base, platform: 'genially' }
  }

  // Prezi
  if (hostMatches(host, 'prezi.com')) {
    if (parts[0] === 'embed' || (parts[0] === 'p' && parts[1] === 'embed')) {
      return { ...base, platform: 'prezi', embedUrl: u.toString() }
    }
    if (parts[0] === 'p' && parts[1] && /^[\w-]+$/.test(parts[1])) {
      return { ...base, platform: 'prezi', embedUrl: `https://prezi.com/p/embed/${parts[1]}/` }
    }
    return { ...base, platform: 'prezi' }
  }

  // Padlet, Wordwall: solo si ya es un enlace de incrustación
  if (hostMatches(host, 'padlet.com')) {
    return { ...base, platform: 'padlet', embedUrl: parts[0] === 'embed' ? u.toString() : null }
  }
  if (hostMatches(host, 'wordwall.net')) {
    return { ...base, platform: 'wordwall', embedUrl: parts[0] === 'embed' ? u.toString() : null }
  }

  if (hostMatches(host, 'liveworksheets.com')) {
    return { ...base, platform: 'liveworksheets', embedUrl: u.toString() }
  }

  // Mentimeter
  if (hostMatches(host, 'mentimeter.com')) {
    if (path.includes('/embed')) return { ...base, platform: 'mentimeter', embedUrl: u.toString() }
    if (parts[0] === 'app' && parts[1] === 'presentation' && parts[2]) {
      return { ...base, platform: 'mentimeter', embedUrl: `https://www.mentimeter.com/app/presentation/${parts[2]}/embed` }
    }
    return { ...base, platform: 'mentimeter' }
  }

  // TimelineJS (Knight Lab)
  if (host === 'cdn.knightlab.com') {
    return { ...base, platform: 'timelinejs', embedUrl: path.includes('/embed') ? u.toString() : null }
  }

  return base
}

/** URL del reproductor con reproducción automática (solo para fachadas de video). */
export function playerUrl(info: EmbedInfo): string | null {
  if (!info.embedUrl) return null
  if (info.platform !== 'youtube' && info.platform !== 'vimeo') return info.embedUrl
  const u = new URL(info.embedUrl)
  u.searchParams.set('autoplay', '1')
  return u.toString()
}
