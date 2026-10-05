import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import type { ProcessedImage } from '../../lib/image'
import { removeObject, uploadWithProgress, type Bucket } from '../../lib/upload'

/** Sube una imagen ya comprimida con nombre UUID. Devuelve la ruta guardada. */
export async function uploadImage(
  bucket: Exclude<Bucket, 'deliverables'>,
  folder: string,
  img: ProcessedImage,
  onProgress: (fraction: number) => void = () => undefined,
  suffix = '',
): Promise<string> {
  const path = `${folder ? `${folder}/` : ''}${crypto.randomUUID()}${suffix}.${img.ext}`
  await uploadWithProgress(bucket, path, img.blob, img.mime, onProgress)
  return path
}

/** Borra un archivo sin interrumpir el flujo si falla (queda como huérfano, no como error visible). */
export async function dropFile(bucket: Bucket, path: string | null | undefined) {
  if (!path) return
  await removeObject(bucket, path).catch(() => undefined)
}

export type Table =
  | 'site_config'
  | 'moments'
  | 'phases'
  | 'phase_deliverables'
  | 'resources'
  | 'videos'
  | 'evidences'
  | 'reflections'
  | 'members'
  | 'member_emails'
  | 'quiz_questions'
  | 'bibliography_refs'

/** Consultas públicas que hay que refrescar cuando cambia cada tabla. */
const PUBLIC_KEYS: Record<Table, string[]> = {
  site_config: ['site_config'],
  moments: ['learning'],
  phases: ['learning'],
  phase_deliverables: ['learning'],
  resources: ['resources', 'phase_counts'],
  videos: ['videos', 'phase_counts'],
  evidences: ['evidences', 'phase_counts'],
  reflections: ['reflections', 'phase_counts'],
  members: ['members'],
  member_emails: [],
  quiz_questions: ['quiz_questions'],
  bibliography_refs: ['bibliography_refs'],
}

/** Filas completas de una tabla, incluidos los borradores (la RLS decide qué ve cada rol). */
export function useAdminRows<T>(table: Table, order: [string, boolean][] = [['position', true]]) {
  return useQuery({
    queryKey: ['admin', table],
    queryFn: async (): Promise<T[]> => {
      let q = supabase.from(table).select('*')
      for (const [col, asc] of order) q = q.order(col, { ascending: asc })
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as T[]
    },
  })
}

export function useRefresh() {
  const qc = useQueryClient()
  return useCallback(
    async (table: Table) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', table] }),
        ...PUBLIC_KEYS[table].map((k) => qc.invalidateQueries({ queryKey: [k] })),
      ])
    },
    [qc],
  )
}

export async function insertRow<T>(table: Table, row: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) throw error
  return data as T
}

export async function updateRow(table: Table, id: string | number, patch: Record<string, unknown>, idCol = 'id') {
  const { data, error } = await supabase.from(table).update(patch).eq(idCol, id).select()
  if (error) throw error
  // La RLS no da error al actualizar algo ajeno: simplemente no afecta ninguna fila.
  if (!data || data.length === 0) throw new Error('No tienes permiso para modificar este elemento.')
}

export async function deleteRow(table: Table, id: string | number, idCol = 'id') {
  const { data, error } = await supabase.from(table).delete().eq(idCol, id).select()
  if (error) throw error
  if (!data || data.length === 0) throw new Error('No tienes permiso para eliminar este elemento.')
}

/** Guarda el nuevo orden (columna position = 1, 2, 3…). */
export async function persistOrder(table: Table, orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from(table).update({ position: i + 1 }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export function friendlyError(e: unknown): string {
  const err = e as { code?: string; message?: string }
  if (err?.code === '42501') return 'No tienes permiso para hacer esto.'
  if (err?.code === '23505') return 'Ya existe un elemento con ese valor.'
  if (err?.code === '23514') return 'Alguno de los datos no cumple las reglas permitidas.'
  if (err?.code === '23503') return 'Este elemento está en uso y no se puede eliminar o cambiar así.'
  if (typeof err?.message === 'string' && /failed to fetch|network/i.test(err.message)) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
  }
  return err?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

/** Ejecuta una acción mostrando éxito o error con avisos (toasts) y controlando el estado «ocupado». */
export function useAction() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <T,>(okMessage: string, fn: () => Promise<T>): Promise<T | undefined> => {
      setBusy(true)
      try {
        const result = await fn()
        if (okMessage) toast('ok', okMessage)
        return result
      } catch (e) {
        toast('error', friendlyError(e))
        return undefined
      } finally {
        setBusy(false)
      }
    },
    [toast],
  )
  return { busy, run }
}
