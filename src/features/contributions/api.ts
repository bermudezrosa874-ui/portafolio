// Acceso a datos de los aportes. La autorización real vive en la base (RLS + disparadores);
// aquí solo se arman las peticiones y se muestran errores amigables.
import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { publicUrl, removeObject, uploadWithProgress } from '../../lib/upload'
import type { ActivityEntry, AppNotification, AppRole, Contribution, ContributionCategory, ContributionKind, ContributionStatus, ValidatedContribution } from './model'

type Ok = Extract<ValidatedContribution, { ok: true }>

export const fileUrl = (c: Pick<Contribution, 'file_path' | 'url' | 'file_name'>): string | null =>
  c.file_path ? publicUrl('contributions', c.file_path) : c.url

export function useContributions(scope: { mine: true; userId: string } | { mine: false }) {
  const mine = scope.mine
  const userId = scope.mine ? scope.userId : null
  return useQuery({
    queryKey: ['contributions', mine ? userId : 'all'],
    queryFn: async (): Promise<Contribution[]> => {
      let q = supabase.from('contributions').select('*').order('created_at', { ascending: false })
      // Filtrar por usuario es comodidad de la interfaz; la RLS es lo que realmente protege.
      if (mine) q = q.eq('uploaded_by', userId!)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Contribution[]
    },
    enabled: !mine || !!userId,
  })
}

export function useRefreshContributions() {
  const qc = useQueryClient()
  return useCallback(async () => {
    await Promise.all(
      ['contributions', 'public_contributions', 'notifications', 'activity'].map((k) => qc.invalidateQueries({ queryKey: [k] })),
    )
  }, [qc])
}

export interface ContributionInput {
  title: string
  description: string
  category: ContributionCategory
  kind: ContributionKind
  url: string | null
  phase_id: number | null
  status: ContributionStatus
}

const newPath = (ownerId: string, ext: string) => `${ownerId}/${crypto.randomUUID()}.${ext}`

async function upload(ownerId: string, file: File, check: Ok, onProgress: (f: number) => void) {
  const path = newPath(ownerId, check.ext)
  await uploadWithProgress('contributions', path, file, check.mime, onProgress)
  return path
}

export async function createContribution(
  userId: string,
  input: ContributionInput,
  file: { file: File; check: Ok } | null,
  onProgress: (f: number) => void = () => undefined,
): Promise<string> {
  const path = file ? await upload(userId, file.file, file.check, onProgress) : null
  const { data, error } = await supabase.from('contributions').insert({
    ...input,
    kind: file ? file.check.kind : 'enlace',
    url: file ? null : input.url,
    file_path: path,
    file_name: file?.file.name ?? null,
    mime_type: file?.check.mime ?? null,
    size_bytes: file?.file.size ?? null,
    uploaded_by: userId,
  }).select('id').single()
  if (error) {
    if (path) await removeObject('contributions', path).catch(() => undefined)
    throw error
  }
  return data.id as string
}

export interface ReviewResult {
  status: ContributionStatus
  note: string | null
}

/**
 * Pide la revisión automática del aporte (la hace una función del servidor con IA).
 * Si sale bien se publica solo; si no, queda pendiente con el motivo. Nunca lanza error: si falla, queda pendiente.
 */
export async function reviewContribution(id: string): Promise<ReviewResult> {
  try {
    const { data, error } = await supabase.functions.invoke('review-contribution', { body: { id } })
    if (error || !data || typeof data.status !== 'string') throw error ?? new Error('sin respuesta')
    return { status: data.status as ContributionStatus, note: (data.note as string | null) ?? null }
  } catch {
    return { status: 'pending_review', note: 'No se pudo revisar automáticamente; Rosa lo revisará.' }
  }
}

export async function updateContribution(id: string, patch: Partial<ContributionInput>): Promise<void> {
  const { data, error } = await supabase.from('contributions').update(patch).eq('id', id).select('id')
  if (error) throw error
  // La RLS no da error al tocar algo ajeno: simplemente no afecta ninguna fila.
  if (!data || data.length === 0) throw new Error('No tienes permiso para modificar este aporte.')
}

export async function replaceContributionFile(
  c: Contribution,
  file: File,
  check: Ok,
  onProgress: (f: number) => void = () => undefined,
): Promise<void> {
  // El archivo vive siempre en la carpeta de quien lo subió (también si Rosa lo reemplaza).
  const path = await upload(c.uploaded_by, file, check, onProgress)
  const { data, error } = await supabase
    .from('contributions')
    .update({ file_path: path, file_name: file.name, mime_type: check.mime, size_bytes: file.size, kind: check.kind, url: null })
    .eq('id', c.id)
    .select('id')
  if (error || !data || data.length === 0) {
    await removeObject('contributions', path).catch(() => undefined)
    if (error) throw error
    throw new Error('No tienes permiso para reemplazar este archivo.')
  }
  if (c.file_path) await removeObject('contributions', c.file_path).catch(() => undefined)
}

export async function deleteContribution(c: Contribution): Promise<void> {
  const { data, error } = await supabase.from('contributions').delete().eq('id', c.id).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('No tienes permiso para eliminar este aporte.')
  if (c.file_path) await removeObject('contributions', c.file_path).catch(() => undefined)
}

// ---------------------------------------------------------------------------
// Notificaciones, actividad y roles (solo administración; la RLS lo impone)
// ---------------------------------------------------------------------------
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      return (data ?? []) as AppNotification[]
    },
    refetchInterval: 60_000,
  })
}

export async function markNotifications(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
  if (error) throw error
}

export function useActivity(limit = 30) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      return (data ?? []) as ActivityEntry[]
    },
    refetchInterval: 60_000,
  })
}

export interface ProfileRow {
  user_id: string
  role: AppRole
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase.from('profiles').select('user_id, role')
      if (error) throw error
      return (data ?? []) as ProfileRow[]
    },
  })
}

export const MAX_ACCOUNTS = 6

export interface AccountRow {
  user_id: string
  email: string
  role: AppRole | null
  member_name: string | null
  created_at: string
}

/** Cuentas con su correo (solo la administradora puede pedirlas; la base lo verifica). */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const { data, error } = await supabase.rpc('admin_list_accounts')
      if (error) throw error
      return (data ?? []) as AccountRow[]
    },
  })
}

/** Rosa crea la cuenta de un compañero: correo cualquiera y contraseña a su elección (queda confirmada y como colaborador). */
export async function createAccount(memberId: string, email: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('admin_create_account', { p_member_id: memberId, p_email: email, p_password: password })
  if (error) throw error
}

/** Elimina una cuenta: libera su cupo y retira la autorización de su correo. Sus aportes se conservan. */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_account', { p_user_id: userId })
  if (error) throw error
}

export async function setRole(userId: string, role: Exclude<AppRole, 'admin'>): Promise<void> {
  // La base rechaza degradar a la única administradora; el cliente nunca ofrece la opción «admin».
  const { data, error } = await supabase.from('profiles').update({ role }).eq('user_id', userId).select('user_id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('No se pudo cambiar el rol.')
}

/** Registra el inicio de sesión (una vez por sesión del navegador). Solo guarda quién y cuándo. */
export function useLogLogin(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    const key = `abaco-login-${userId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* sin sessionStorage: se registra igual, la base evita duplicados cercanos */
    }
    void supabase.rpc('log_login')
  }, [userId])
}
