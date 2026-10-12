// Lectura pública de los aportes publicados. El cliente de Supabase se carga bajo demanda
// (igual que el resto de secciones) para no pesar en la portada.
import { useQuery } from '@tanstack/react-query'
import type { Contribution } from './model'

export type PublicContribution = Pick<
  Contribution,
  'id' | 'title' | 'description' | 'kind' | 'category' | 'url' | 'file_path' | 'file_name' | 'size_bytes' | 'phase_id' | 'uploaded_by_name' | 'created_at'
>

export function usePublishedContributions() {
  return useQuery({
    queryKey: ['public_contributions'],
    queryFn: async (): Promise<PublicContribution[]> => {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase
        .from('contributions')
        .select('id, title, description, kind, category, url, file_path, file_name, size_bytes, phase_id, uploaded_by_name, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as PublicContribution[]
    },
  })
}
