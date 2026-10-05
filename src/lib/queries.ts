import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_CONFIG, DEFAULT_MEMBERS } from './defaults'
import type {
  BibliographyRef,
  QuizQuestion,
  Reflection,
  Deliverable,
  Evidence,
  Member,
  Moment,
  Phase,
  PhaseCounts,
  Resource,
  SiteConfig,
  Video,
} from '../types'

// El cliente se carga bajo demanda: la portada se pinta con textos de respaldo sin esperarlo.
let client: Promise<SupabaseClient> | undefined
const getSupabase = () => (client ??= import('./supabase').then((m) => m.supabase))

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site_config'],
    queryFn: async (): Promise<SiteConfig> => {
      const { data, error } = await (await getSupabase()).from('site_config').select('*').eq('id', 1).single()
      if (error) throw error
      return data as SiteConfig
    },
    placeholderData: DEFAULT_CONFIG,
  })
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await (await getSupabase()).from('members').select('*').order('position')
      if (error) throw error
      return data as Member[]
    },
    placeholderData: DEFAULT_MEMBERS,
  })
}

export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await (await getSupabase())
        .from('resources')
        .select('id, kind, title, url, embed_url, cover_path, description, phase_id, position')
        .eq('published', true)
        .order('position')
        .order('created_at')
      if (error) throw error
      return data as Resource[]
    },
  })
}

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async (): Promise<Video[]> => {
      const { data, error } = await (await getSupabase())
        .from('videos')
        .select(
          'id, title, url, embed_url, platform, thumbnail_url, participants, duration, description, credits, behind_scenes, phase_id, position',
        )
        .eq('published', true)
        .order('position')
        .order('created_at')
      if (error) throw error
      return data as Video[]
    },
  })
}

export function useEvidences() {
  return useQuery({
    queryKey: ['evidences'],
    queryFn: async (): Promise<Evidence[]> => {
      const { data, error } = await (await getSupabase())
        .from('evidences')
        .select(
          'id, image_path, thumb_path, title, description, category, phase_id, member_ids, taken_on, width, height, position',
        )
        .eq('published', true)
        .order('position')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Evidence[]
    },
  })
}

export function useReflections() {
  return useQuery({
    queryKey: ['reflections'],
    queryFn: async (): Promise<Reflection[]> => {
      const { data, error } = await (await getSupabase())
        .from('reflections')
        .select('id, member_id, phase_id, aprendi, dificulto, sorprendio, quisiera_aprender')
      if (error) throw error
      return data as Reflection[]
    },
  })
}

export function useReferences() {
  return useQuery({
    queryKey: ['bibliography_refs'],
    queryFn: async (): Promise<BibliographyRef[]> => {
      const { data, error } = await (await getSupabase())
        .from('bibliography_refs')
        .select('id, apa_text, kind, url, authors, year, position')
        .eq('published', true)
      if (error) throw error
      return data as BibliographyRef[]
    },
  })
}

export function useQuizQuestions() {
  return useQuery({
    queryKey: ['quiz_questions'],
    queryFn: async (): Promise<QuizQuestion[]> => {
      const { data, error } = await (await getSupabase())
        .from('quiz_questions')
        .select('id, question, options, correct_index, explanation, topic, position')
        .eq('published', true)
        .order('position')
      if (error) throw error
      return data as QuizQuestion[]
    },
  })
}

export interface LearningData {
  moments: Moment[]
  phases: Phase[]
  deliverables: Deliverable[]
}

export function useLearningData() {
  return useQuery({
    queryKey: ['learning'],
    queryFn: async (): Promise<LearningData> => {
      const supabase = await getSupabase()
      const [m, p, d] = await Promise.all([
        supabase.from('moments').select('*').order('position'),
        supabase.from('phases').select('*').order('position'),
        supabase.from('phase_deliverables').select('*').eq('published', true),
      ])
      if (m.error) throw m.error
      if (p.error) throw p.error
      if (d.error) throw d.error
      return {
        moments: m.data as Moment[],
        phases: p.data as Phase[],
        deliverables: d.data as Deliverable[],
      }
    },
  })
}

/** Conteos por fase para los accesos rápidos (solo cuenta lo publicado: lo impone la RLS). */
export function usePhaseCounts() {
  return useQuery({
    queryKey: ['phase_counts'],
    queryFn: async (): Promise<Record<number, PhaseCounts>> => {
      const supabase = await getSupabase()
      const [r, v, e, f] = await Promise.all([
        supabase.from('resources').select('phase_id').eq('published', true),
        supabase.from('videos').select('phase_id').eq('published', true),
        supabase.from('evidences').select('phase_id').eq('published', true),
        supabase.from('reflections').select('phase_id, aprendi, dificulto, sorprendio, quisiera_aprender'),
      ])
      for (const res of [r, v, e, f]) if (res.error) throw res.error

      const counts: Record<number, PhaseCounts> = {}
      const at = (id: number | null) => {
        if (id == null) return null
        return (counts[id] ??= { resources: 0, videos: 0, evidences: 0, reflections: 0 })
      }
      for (const row of (r.data ?? []) as { phase_id: number | null }[]) {
        const c = at(row.phase_id)
        if (c) c.resources++
      }
      for (const row of (v.data ?? []) as { phase_id: number | null }[]) {
        const c = at(row.phase_id)
        if (c) c.videos++
      }
      for (const row of (e.data ?? []) as { phase_id: number | null }[]) {
        const c = at(row.phase_id)
        if (c) c.evidences++
      }
      for (const row of (f.data ?? []) as {
        phase_id: number
        aprendi: string
        dificulto: string
        sorprendio: string
        quisiera_aprender: string
      }[]) {
        const complete = [row.aprendi, row.dificulto, row.sorprendio, row.quisiera_aprender].every(
          (t) => t.trim().length > 0,
        )
        const c = at(row.phase_id)
        if (c && complete) c.reflections++
      }
      return counts
    },
  })
}
