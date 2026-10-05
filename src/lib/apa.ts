// Referencias en formato APA 7.ª edición.
// El texto guarda la cursiva con asteriscos: *Título*. Se muestra como <em> y al copiar se quita.

export type RefKind = 'libro' | 'articulo' | 'web' | 'imagen' | 'video' | 'recurso' | 'herramienta'

export const REF_KIND_LABEL: Record<RefKind, string> = {
  libro: 'Libros',
  articulo: 'Artículos',
  web: 'Páginas web',
  imagen: 'Imágenes',
  video: 'Videos',
  recurso: 'Recursos educativos',
  herramienta: 'Herramientas',
}

export interface ApaFields {
  kind: RefKind
  /** Ya con formato APA: «Apellido, N., & Apellido, M.» */
  authors: string
  /** «2021», «2021, 5 de mayo» o vacío (se escribe «s. f.»). */
  year: string
  title: string
  /** Editorial, revista o sitio web. */
  source: string
  /** Edición, volumen(número) y páginas, o el descriptor entre corchetes («Fotografía», «Video»…). */
  detail: string
  url: string
}

const clean = (s: string) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim()
// No duplica el punto aunque el texto termine con la cursiva cerrada: «*Libro.*»
const endWithPeriod = (s: string) => (/[.?!]\*?$/.test(s) ? s : `${s}.`)

const DEFAULT_DESCRIPTOR: Partial<Record<RefKind, string>> = {
  imagen: 'Fotografía',
  video: 'Video',
  recurso: 'Recurso educativo',
  herramienta: 'Software',
}

/** Arma la referencia APA 7 a partir de los campos del formulario. */
export function buildApa(f: ApaFields): string {
  const authors = clean(f.authors)
  const year = clean(f.year) || 's. f.'
  const title = clean(f.title)
  const source = clean(f.source)
  const detail = clean(f.detail)
  const url = f.url.trim()
  if (!title) return ''

  const parts: string[] = []
  const withDate = (head: string) => parts.push(`${head} (${year}).`)
  const descriptor = `[${detail || DEFAULT_DESCRIPTOR[f.kind] || ''}]`

  switch (f.kind) {
    case 'libro':
      if (authors) withDate(endWithPeriod(authors))
      parts.push(endWithPeriod(`*${title}*${detail ? ` (${detail})` : ''}`))
      if (!authors) parts.push(`(${year}).`)
      if (source) parts.push(endWithPeriod(source))
      break
    case 'articulo':
      if (authors) withDate(endWithPeriod(authors))
      parts.push(endWithPeriod(title))
      if (!authors) parts.push(`(${year}).`)
      if (source) parts.push(endWithPeriod(`*${source}*${detail ? `, ${detail}` : ''}`))
      break
    case 'web':
      if (authors) withDate(endWithPeriod(authors))
      parts.push(endWithPeriod(`*${title}*`))
      if (!authors) parts.push(`(${year}).`)
      if (source) parts.push(endWithPeriod(source))
      break
    default: {
      // imagen, video, recurso, herramienta
      if (authors) withDate(endWithPeriod(authors))
      parts.push(endWithPeriod(`*${title}* ${descriptor}`))
      if (!authors) parts.push(`(${year}).`)
      if (source) parts.push(endWithPeriod(source))
    }
  }
  if (url) parts.push(url) // APA 7: la URL no lleva punto final
  return parts.join(' ').replace(/\.\./g, '.').trim()
}

export const stripMarkers = (text: string) => text.replace(/\*/g, '')

/** Clave de orden alfabético: sin marcas, sin tildes y sin signos iniciales. */
export function sortKey(apa: string): string {
  return stripMarkers(apa)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .toLowerCase()
}

export const compareApa = (a: string, b: string) => sortKey(a).localeCompare(sortKey(b), 'es')

export type ApaToken =
  | { type: 'text'; value: string }
  | { type: 'em'; value: string }
  | { type: 'link'; value: string; href: string }

/** Divide el texto en texto, cursiva y enlaces. Solo se enlazan URLs http(s) válidas. */
export function parseApa(text: string): ApaToken[] {
  const tokens: ApaToken[] = []
  const re = /\*([^*]+)\*|(https?:\/\/[^\s<>"]+)/g
  let last = 0
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0
    if (index > last) tokens.push({ type: 'text', value: text.slice(last, index) })
    if (m[1] !== undefined) {
      tokens.push({ type: 'em', value: m[1] })
    } else {
      const raw = m[2]
      const trimmed = raw.replace(/[.,;:)\]]+$/, '')
      const tail = raw.slice(trimmed.length)
      let ok = false
      try {
        const u = new URL(trimmed)
        ok = u.protocol === 'https:' || u.protocol === 'http:'
      } catch {
        ok = false
      }
      tokens.push(ok ? { type: 'link', value: trimmed, href: trimmed } : { type: 'text', value: trimmed })
      if (tail) tokens.push({ type: 'text', value: tail })
    }
    last = index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })
  return tokens
}
