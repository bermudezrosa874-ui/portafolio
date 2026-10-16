// Participación de cada integrante, calculada solo con datos que ya existen y son públicos
// (lo publicado + las reflexiones). No hay puntajes: son conteos y fechas reales.
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGroupEntries, useLearningData, useMembers } from '../../lib/queries'
import type { GroupCard, GroupEntry, Member } from '../../types'

export const GROUP_CARDS: { id: GroupCard; title: string; hint: string }[] = [
  { id: 'conocimiento', title: 'Conocimiento', hint: 'Qué aprendimos sobre la temática' },
  { id: 'habilidades', title: 'Habilidades', hint: 'Qué aprendimos a hacer' },
  { id: 'experiencia', title: 'Experiencia', hint: 'Qué nos dejó el proceso' },
]

export type WorkType = 'aporte' | 'recurso' | 'entrevista' | 'evidencia' | 'entrega'

export interface WorkItem {
  id: string
  type: WorkType
  /** Sección del portafolio donde se ve (para el botón «Abrir»). */
  section: string
  /** «Infografía», «Entrevista»… */
  label: string
  /** «una infografía», para la línea de tiempo («Subió una infografía»). */
  verb: string
  title: string
  phaseId: number | null
  date: string
  authorId: string | null
}

export interface ReflectionRow {
  member_id: string
  phase_id: number
  aprendi: string
  dificulto: string
  sorprendio: string
  quisiera_aprender: string
  updated_at: string
}

interface RawData {
  items: WorkItem[]
  reflections: ReflectionRow[]
}

const RESOURCE_KIND: Record<string, [label: string, verb: string]> = {
  infografia: ['Infografía', 'una infografía'],
  presentacion: ['Presentación', 'una presentación'],
  actividad: ['Actividad', 'una actividad'],
  mapa_mental: ['Mapa mental', 'un mapa mental'],
  juego: ['Juego', 'un juego'],
  otro: ['Recurso', 'un recurso'],
  timeline: ['Línea de tiempo', 'la línea de tiempo'],
}
const CONTRIBUTION_KIND: Record<string, [string, string]> = {
  documento: ['Documento', 'un documento'],
  presentacion: ['Presentación', 'una presentación'],
  imagen: ['Imagen', 'una imagen'],
  video: ['Video', 'un video'],
  enlace: ['Enlace', 'un enlace'],
}

async function fetchRaw(): Promise<RawData> {
  const { supabase } = await import('../../lib/supabase')
  const [res, vid, evi, con, del, ref] = await Promise.all([
    supabase.from('resources').select('id, kind, title, phase_id, uploaded_by, created_at').eq('published', true),
    supabase.from('videos').select('id, title, phase_id, uploaded_by, created_at').eq('published', true),
    supabase.from('evidences').select('id, title, phase_id, created_by, created_at').eq('published', true),
    supabase.from('contributions').select('id, title, kind, phase_id, uploaded_by, created_at').eq('published', true),
    supabase.from('phase_deliverables').select('id, phase_id, file_name, uploaded_by, created_at').eq('published', true),
    supabase.from('reflections').select('member_id, phase_id, aprendi, dificulto, sorprendio, quisiera_aprender, updated_at'),
  ])
  for (const r of [res, vid, evi, con, del, ref]) if (r.error) throw r.error

  const items: WorkItem[] = []
  for (const r of res.data ?? []) {
    const [label, verb] = RESOURCE_KIND[r.kind] ?? RESOURCE_KIND.otro
    items.push({ id: r.id, type: 'recurso', section: r.kind === 'timeline' ? 'linea-de-tiempo' : 'recursos', label, verb, title: r.title, phaseId: r.phase_id, date: r.created_at, authorId: r.uploaded_by })
  }
  for (const v of vid.data ?? []) {
    items.push({ id: v.id, type: 'entrevista', section: 'entrevistas', label: 'Entrevista', verb: 'una entrevista', title: v.title, phaseId: v.phase_id, date: v.created_at, authorId: v.uploaded_by })
  }
  for (const e of evi.data ?? []) {
    items.push({ id: e.id, type: 'evidencia', section: 'galeria', label: 'Evidencia', verb: 'una evidencia', title: e.title, phaseId: e.phase_id, date: e.created_at, authorId: e.created_by })
  }
  for (const c of con.data ?? []) {
    const [label, verb] = CONTRIBUTION_KIND[c.kind] ?? CONTRIBUTION_KIND.documento
    items.push({ id: c.id, type: 'aporte', section: 'aportes', label, verb, title: c.title, phaseId: c.phase_id, date: c.created_at, authorId: c.uploaded_by })
  }
  for (const d of del.data ?? []) {
    items.push({ id: d.id, type: 'entrega', section: 'aprendizajes', label: 'Documento de fase', verb: `el documento de la Fase ${d.phase_id}`, title: d.file_name, phaseId: d.phase_id, date: d.created_at, authorId: d.uploaded_by })
  }
  return { items, reflections: (ref.data ?? []) as ReflectionRow[] }
}

export const useParticipationData = () => useQuery({ queryKey: ['participation'], queryFn: fetchRaw })

const filled = (r: ReflectionRow) => [r.aprendi, r.dificulto, r.sorprendio, r.quisiera_aprender].some((t) => t.trim())
const complete = (r: ReflectionRow) => [r.aprendi, r.dificulto, r.sorprendio, r.quisiera_aprender].every((t) => t.trim())

export interface TimelineEvent {
  key: string
  date: string
  text: string
}

export interface MemberStats {
  member: Member
  bitacoraDone: number
  bitacoraTotal: number
  groupDone: number
  groupTotal: number
  groupEntries: GroupEntry[]
  items: WorkItem[]
  counts: Record<WorkType, number>
  lastActivity: string | null
  events: TimelineEvent[]
  /** Última reflexión de bitácora con texto: fase y un fragmento. */
  lastReflection: { phaseId: number; snippet: string } | null
}

export interface TeamSummary {
  reflexiones: number
  aportes: number
  recursos: number
  evidencias: number
}

const snippetOf = (r: ReflectionRow) => {
  const text = [r.aprendi, r.sorprendio, r.dificulto, r.quisiera_aprender].find((t) => t.trim())?.trim() ?? ''
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text
}

export function useParticipation() {
  const { data: members = [] } = useMembers()
  const { data: learning } = useLearningData()
  const { data: groupEntries = [] } = useGroupEntries()
  const { data: raw, isLoading } = useParticipationData()
  const phaseTotal = learning?.phases.length || 5

  const stats = useMemo(() => {
    const items = raw?.items ?? []
    const reflections = raw?.reflections ?? []
    const list: MemberStats[] = members.map((m) => {
      const mine = m.user_id ? items.filter((i) => i.authorId === m.user_id).sort((a, b) => b.date.localeCompare(a.date)) : []
      const refl = reflections.filter((r) => r.member_id === m.id && filled(r)).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      const group = groupEntries.filter((g) => g.member_id === m.id)
      const counts: Record<WorkType, number> = { aporte: 0, recurso: 0, entrevista: 0, evidencia: 0, entrega: 0 }
      for (const i of mine) counts[i.type]++

      const events: TimelineEvent[] = [
        ...mine.map((i) => ({ key: `i-${i.id}`, date: i.date, text: `Subió ${i.verb}` })),
        ...refl.map((r) => ({ key: `r-${r.phase_id}`, date: r.updated_at, text: `Escribió su bitácora de la Fase ${r.phase_id}` })),
        ...group.map((g) => ({
          key: `g-${g.id}`,
          date: g.updated_at,
          text: `Aportó a la reflexión grupal (${GROUP_CARDS.find((c) => c.id === g.card)?.title ?? g.card})`,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date))

      return {
        member: m,
        bitacoraDone: reflections.filter((r) => r.member_id === m.id && complete(r)).length,
        bitacoraTotal: phaseTotal,
        groupDone: new Set(group.map((g) => g.card)).size,
        groupTotal: GROUP_CARDS.length,
        groupEntries: group,
        items: mine,
        counts,
        lastActivity: events[0]?.date ?? null,
        events,
        lastReflection: refl[0] ? { phaseId: refl[0].phase_id, snippet: snippetOf(refl[0]) } : null,
      }
    })

    const all = raw?.items ?? []
    const summary: TeamSummary = {
      reflexiones: reflections.filter(filled).length + groupEntries.length,
      aportes: all.filter((i) => i.type === 'aporte' || i.type === 'entrega').length,
      recursos: all.filter((i) => i.type === 'recurso' || i.type === 'entrevista').length,
      evidencias: all.filter((i) => i.type === 'evidencia').length,
    }
    return { list, summary }
  }, [members, raw, groupEntries, phaseTotal])

  return { ...stats, isLoading, phases: learning?.phases ?? [] }
}
