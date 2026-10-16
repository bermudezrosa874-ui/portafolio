export interface SiteConfig {
  id: number
  title: string
  subtitle: string
  motto: string
  course: string
  university: string
  center: string
  program: string
  teacher: string
  period: string
  group_name: string
  intro_text: string
  purpose: string
  general_objective: string
  specific_objectives: string[]
  timeline_text: string
  timeline_learned: string
  videos_intro: string
  group_reflection: string
  reflection_knowledge: string
  reflection_skills: string
  reflection_experience: string
  team_text: string
}

export interface Moment {
  id: 'inicial' | 'intermedio' | 'final'
  title: string
  color: string
  description: string
  position: number
}

export type PhaseStatus = 'pendiente' | 'en_progreso' | 'entregada'

export interface Phase {
  id: number
  moment_id: Moment['id']
  title: string
  rac: string
  description: string
  start_date: string | null
  end_date: string | null
  status: PhaseStatus
  que_aprendimos: string
  position: number
  /** La fase se dio por completa: ya no acepta subidas nuevas (la administradora puede reabrirla). */
  uploads_closed?: boolean
}

export interface Deliverable {
  id: string
  phase_id: number
  file_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  uploaded_by: string | null
  uploaded_by_name: string | null
  published: boolean
  created_at: string
}

export type ResourceKind =
  | 'infografia'
  | 'presentacion'
  | 'actividad'
  | 'mapa_mental'
  | 'juego'
  | 'otro'
  | 'timeline'

export interface Resource {
  id: string
  kind: ResourceKind
  title: string
  url: string
  embed_url: string | null
  cover_path: string | null
  description: string
  phase_id: number | null
  position: number
  uploaded_by?: string | null
  uploaded_by_name?: string
}

export interface BehindScenes {
  como_se_hizo?: string
  que_investigaron?: string
  herramientas?: string
  dificultades?: string
  aprendizajes?: string
}

export interface Video {
  id: string
  title: string
  url: string
  embed_url: string | null
  platform: string | null
  thumbnail_url: string | null
  participants: string
  duration: string
  description: string
  credits: string
  behind_scenes: BehindScenes
  phase_id: number | null
  position: number
  uploaded_by?: string | null
  uploaded_by_name?: string
}

export type EvidenceCategory =
  | 'capturas'
  | 'conversaciones'
  | 'foro'
  | 'grabaciones'
  | 'bocetos'
  | 'investigacion'
  | 'diseno'
  | 'otros'

export interface Evidence {
  id: string
  image_path: string
  thumb_path: string | null
  title: string
  description: string
  category: EvidenceCategory
  phase_id: number | null
  member_ids: string[]
  taken_on: string | null
  width: number | null
  height: number | null
  position: number
}

export interface Reflection {
  id: string
  member_id: string
  phase_id: number
  aprendi: string
  dificulto: string
  sorprendio: string
  quisiera_aprender: string
}

export type ReferenceKind = 'libro' | 'articulo' | 'web' | 'imagen' | 'video' | 'recurso' | 'herramienta'

export interface BibliographyRef {
  id: string
  apa_text: string
  kind: ReferenceKind
  url: string | null
  authors: string | null
  year: string | null
  position: number
}

export interface PhaseCounts {
  resources: number
  videos: number
  evidences: number
  reflections: number
}

export interface Member {
  id: string
  name: string
  topic: string
  role: string
  contribution: string
  program: string
  photo_path: string | null
  position: number
  user_id: string | null
  /** Color propio de la persona (paleta del portafolio); se usa igual en Equipo, Bitácora y Reflexión grupal. */
  color: string | null
  /** Símbolo matemático favorito (máx. 3 caracteres). Vacío = sin insignia. */
  symbol: string
  about: string
  quote: string
}

export type GroupCard = 'conocimiento' | 'habilidades' | 'experiencia'

export interface GroupEntry {
  id: string
  card: GroupCard
  member_id: string
  content: string
  created_at: string
  updated_at: string
}
