// Modelo compartido de los aportes del equipo: tipos, etiquetas amigables y validación de archivos.
import { createElement } from 'react'
import { Clapperboard, FileText, Image, Link2, Presentation, type LucideIcon } from 'lucide-react'
import { DOCX_MIME, MB } from '../../lib/fileValidation'

export type ContributionStatus = 'draft' | 'pending_review' | 'published' | 'hidden'
export type ContributionKind = 'documento' | 'presentacion' | 'imagen' | 'video' | 'enlace'
export type ContributionCategory = 'entregas' | 'investigacion' | 'entrevistas' | 'recursos' | 'imagenes' | 'otros'

export interface Contribution {
  id: string
  title: string
  description: string
  kind: ContributionKind
  category: ContributionCategory
  url: string | null
  file_path: string | null
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  phase_id: number | null
  status: ContributionStatus
  published: boolean
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
  updated_at: string
  /** Motivo por el que la revisión automática no lo publicó (si aplica). */
  review_note: string | null
}

export interface AppNotification {
  id: string
  kind: 'new_contribution' | 'updated_contribution'
  title: string
  actor_id: string | null
  actor_name: string
  contribution_id: string | null
  read: boolean
  created_at: string
}

export type ActivityAction = 'LOGIN' | 'UPLOAD_RESOURCE' | 'UPDATE_RESOURCE' | 'REPLACE_FILE' | 'DELETE_RESOURCE' | 'PUBLISH_RESOURCE'

export interface ActivityEntry {
  id: string
  user_id: string | null
  user_name: string
  action: ActivityAction
  resource_id: string | null
  resource_title: string
  created_at: string
}

export type AppRole = 'admin' | 'collaborator' | 'user'

export const ROLE_LABEL: Record<AppRole, string> = { admin: 'Administradora', collaborator: 'Colaborador', user: 'Usuario' }

export const STATUS_LABEL: Record<ContributionStatus, string> = {
  draft: 'Borrador',
  pending_review: 'Pendiente de revisión',
  published: 'Publicado',
  hidden: 'Oculto',
}

/** Colores pastel del portafolio: gris, rosa, menta y lila. */
export const STATUS_TONE: Record<ContributionStatus, string> = {
  draft: 'bg-slate-400/20 text-[var(--text)]',
  pending_review: 'bg-pink-400/25 text-pink-300 [html[data-theme=light]_&]:text-pink-800',
  published: 'bg-emerald-400/25 text-emerald-300 [html[data-theme=light]_&]:text-emerald-800',
  hidden: 'bg-violet-400/25 text-violet-300 [html[data-theme=light]_&]:text-violet-800',
}

export const KIND_LABEL: Record<ContributionKind, string> = {
  documento: 'Documento',
  presentacion: 'Presentación',
  imagen: 'Imagen',
  video: 'Video',
  enlace: 'Enlace',
}
export const KIND_ICON: Record<ContributionKind, LucideIcon> = { documento: FileText, presentacion: Presentation, imagen: Image, video: Clapperboard, enlace: Link2 }

/** Ícono del tipo de aporte (documento, presentación, imagen, video o enlace). */
export const KindIcon = ({ kind, size = 22 }: { kind: ContributionKind; size?: number }) => createElement(KIND_ICON[kind], { size, 'aria-hidden': true })

export const CATEGORY_LABEL: Record<ContributionCategory, string> = {
  entregas: 'Entregas',
  investigacion: 'Investigación',
  entrevistas: 'Entrevistas',
  recursos: 'Recursos',
  imagenes: 'Imágenes',
  otros: 'Otros',
}

export const ACTION_LABEL: Record<ActivityAction, string> = {
  LOGIN: 'inició sesión',
  UPLOAD_RESOURCE: 'subió',
  UPDATE_RESOURCE: 'actualizó',
  REPLACE_FILE: 'reemplazó el archivo de',
  DELETE_RESOURCE: 'eliminó',
  PUBLISH_RESOURCE: 'publicó',
}

// ---------------------------------------------------------------------------
// Formato de fechas (es-CO): «11/10/2026» y «7:42 p. m.»
// ---------------------------------------------------------------------------
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO')
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

export function fmtAgo(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'Justo ahora'
  if (min < 60) return `Hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`
  const h = Math.round(min / 60)
  if (h < 24) return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`
  const yesterday = new Date(now - 86400000).toDateString() === new Date(iso).toDateString()
  return `${yesterday ? 'Ayer' : fmtDate(iso)}, ${fmtTime(iso)}`
}

export function fmtSize(bytes: number | null): string {
  if (!bytes) return '—'
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// ---------------------------------------------------------------------------
// Validación de archivos: tipo REAL por firma de bytes, nunca solo la extensión.
// ---------------------------------------------------------------------------
export const CONTRIBUTION_MAX = 50 * MB
export const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
export const CONTRIBUTION_ACCEPT = '.pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp,.mp4,.webm'

const sig = (b: Uint8Array, s: number[], at = 0) => s.every((v, i) => b[at + i] === v)

/** Un .docx/.pptx es un ZIP: se busca su carpeta característica al inicio y al final del archivo. */
async function zipHas(file: File, marker: string): Promise<boolean> {
  const dec = new TextDecoder('latin1')
  const first = dec.decode(await file.slice(0, 8192).arrayBuffer())
  const last = dec.decode(await file.slice(Math.max(0, file.size - 262144)).arrayBuffer())
  return first.includes(marker) || last.includes(marker)
}

export type ValidatedContribution = { ok: true; mime: string; kind: ContributionKind; ext: string } | { ok: false; error: string }

export async function validateContributionFile(file: File): Promise<ValidatedContribution> {
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' }
  if (file.size > CONTRIBUTION_MAX) {
    return { ok: false, error: `El archivo pesa ${(file.size / MB).toFixed(1)} MB. El máximo es 50 MB.` }
  }
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (sig(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ok: true, mime: 'application/pdf', kind: 'documento', ext: 'pdf' }
  if (sig(b, [0xff, 0xd8, 0xff])) return { ok: true, mime: 'image/jpeg', kind: 'imagen', ext: 'jpg' }
  if (sig(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ok: true, mime: 'image/png', kind: 'imagen', ext: 'png' }
  if (sig(b, [0x52, 0x49, 0x46, 0x46]) && sig(b, [0x57, 0x45, 0x42, 0x50], 8)) return { ok: true, mime: 'image/webp', kind: 'imagen', ext: 'webp' }
  if (sig(b, [0x66, 0x74, 0x79, 0x70], 4)) return { ok: true, mime: 'video/mp4', kind: 'video', ext: 'mp4' }
  if (sig(b, [0x1a, 0x45, 0xdf, 0xa3])) return { ok: true, mime: 'video/webm', kind: 'video', ext: 'webm' }
  if (sig(b, [0x50, 0x4b, 0x03, 0x04])) {
    if (await zipHas(file, 'ppt/')) return { ok: true, mime: PPTX_MIME, kind: 'presentacion', ext: 'pptx' }
    if (await zipHas(file, 'word/')) return { ok: true, mime: DOCX_MIME, kind: 'documento', ext: 'docx' }
  }
  return { ok: false, error: 'Formato no permitido. Usa PDF, Word (.docx), PowerPoint (.pptx), imagen JPG/PNG/WebP o video MP4/WebM.' }
}
