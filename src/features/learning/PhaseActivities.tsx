import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { Button, TextArea, TextField } from '../../components/ui/forms'
import { useConfirm } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { useRole } from '../../hooks/useAuth'
import { friendlyError } from '../admin/adminData'
import { formatDate } from './parts'

interface Activity {
  id: string
  title: string
  description: string
  activity_date: string
  created_by_name: string
  /** Solo llega cuando hay sesión; sirve para mostrar editar/eliminar en lo propio. */
  created_by?: string | null
}

const getSupabase = async () => (await import('../../lib/supabase')).supabase

/** Actividades de una fase con su fecha. Las ve todo el mundo; Rosa y los colaboradores las agregan. */
export function PhaseActivities({ phaseId, color }: { phaseId: number; color: string }) {
  const { session, isAdmin, isCollaborator } = useRole()
  const userId = session?.user.id
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const canAdd = isAdmin || isCollaborator

  const [editing, setEditing] = useState<Activity | 'new' | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})
  const [saving, setSaving] = useState(false)

  const { data: items = [] } = useQuery({
    queryKey: ['phase_activities', phaseId, userId ?? null],
    queryFn: async (): Promise<Activity[]> => {
      const supabase = await getSupabase()
      // Quien no ha iniciado sesión no necesita saber quién es el dueño interno de cada fila.
      const cols = userId ? 'id, title, description, activity_date, created_by_name, created_by' : 'id, title, description, activity_date, created_by_name'
      const { data, error } = await supabase.from('phase_activities').select(cols).eq('phase_id', phaseId).order('activity_date').order('created_at')
      if (error) throw error
      return (data ?? []) as unknown as Activity[]
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['phase_activities', phaseId] })

  const open = (a: Activity | 'new') => {
    setEditing(a)
    setTitle(a === 'new' ? '' : a.title)
    setDate(a === 'new' ? '' : a.activity_date)
    setDescription(a === 'new' ? '' : a.description)
    setErrors({})
  }

  const save = async () => {
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Escribe la actividad.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Elige la fecha.'
    setErrors(next)
    if (next.title || next.date) return
    setSaving(true)
    try {
      const supabase = await getSupabase()
      const payload = { title: title.trim(), description: description.trim(), activity_date: date }
      if (editing && editing !== 'new') {
        const { data, error } = await supabase.from('phase_activities').update(payload).eq('id', editing.id).select('id')
        if (error) throw error
        // La RLS no da error al tocar algo ajeno: simplemente no afecta ninguna fila.
        if (!data?.length) throw new Error('No tienes permiso para modificar esta actividad.')
      } else {
        const { error } = await supabase.from('phase_activities').insert({ ...payload, phase_id: phaseId })
        if (error) throw error
      }
      await refresh()
      toast('ok', editing === 'new' ? 'Actividad agregada.' : 'Actividad actualizada.')
      setEditing(null)
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a: Activity) => {
    const yes = await confirm({ title: 'Eliminar actividad', message: `«${a.title}» se eliminará de esta fase.`, confirmLabel: 'Eliminar', danger: true })
    if (!yes) return
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('phase_activities').delete().eq('id', a.id).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('No tienes permiso para eliminar esta actividad.')
      await refresh()
      toast('ok', 'Actividad eliminada.')
    } catch (e) {
      toast('error', friendlyError(e))
    }
  }

  // Quien solo visita no ve un bloque vacío: si no hay actividades, queda cerrado.
  if (!canAdd && items.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Actividades y fechas</h4>
        {canAdd && !editing && (
          <Button variant="secondary" onClick={() => open('new')}>
            <PlusCircle size={16} aria-hidden /> Agregar actividad
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
          Todavía no hay actividades en esta fase. {canAdd ? 'Agrega la primera con su fecha.' : 'Pronto aparecerán aquí.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const mine = isAdmin || (!!userId && a.created_by === userId)
            return (
              <li key={a.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-[var(--text)]" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}>
                  <CalendarDays size={15} aria-hidden /> {formatDate(a.activity_date)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--text)]">{a.title}</p>
                  {a.description && <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">{a.description}</p>}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Agregada por {a.created_by_name || 'Integrante'}</p>
                </div>
                {mine && (
                  <div className="flex gap-1">
                    <Button variant="ghost" aria-label={`Editar ${a.title}`} onClick={() => open(a)}>
                      <Pencil size={15} aria-hidden />
                    </Button>
                    <Button variant="ghost" aria-label={`Eliminar ${a.title}`} onClick={() => void remove(a)}>
                      <Trash2 size={15} aria-hidden />
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <div className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h5 className="font-semibold text-[var(--text)]">{editing === 'new' ? 'Nueva actividad' : 'Editar actividad'}</h5>
          <TextField label="Actividad" value={title} onChange={setTitle} error={errors.title} required maxLength={200} />
          <TextField label="Fecha" type="date" value={date} onChange={setDate} error={errors.date} required />
          <TextArea label="Detalle (opcional)" value={description} onChange={setDescription} rows={2} maxLength={1000} />
          <div className="flex flex-wrap gap-2">
            <Button loading={saving} onClick={() => void save()}>
              {editing === 'new' ? 'Agregar' : 'Guardar cambios'}
            </Button>
            <Button variant="ghost" disabled={saving} onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
