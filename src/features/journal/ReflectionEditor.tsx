import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from '../../lib/zod'
import { supabase } from '../../lib/supabase'
import type { Member, Phase, Reflection } from '../../types'

export const REFLECTION_FIELDS = [
  { key: 'aprendi', title: 'Lo que aprendí' },
  { key: 'dificulto', title: 'Lo que se me dificultó' },
  { key: 'sorprendio', title: 'Lo que me sorprendió' },
  { key: 'quisiera_aprender', title: 'Lo que me gustaría aprender' },
] as const

type FieldKey = (typeof REFLECTION_FIELDS)[number]['key']

const field = z.string().trim().max(4000, 'Máximo 4000 caracteres.')
const schema = z.object({
  aprendi: field,
  dificulto: field,
  sorprendio: field,
  quisiera_aprender: field,
})

interface Props {
  member: Member
  phase: Phase
  existing: Reflection | undefined
  onDone: () => void
}

export function ReflectionEditor({ member, phase, existing, onDone }: Props) {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<FieldKey, string>>({
    aprendi: existing?.aprendi ?? '',
    dificulto: existing?.dificulto ?? '',
    sorprendio: existing?.sorprendio ?? '',
    quisiera_aprender: existing?.quisiera_aprender ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as FieldKey] = issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setSaving(true)
    const { error } = await supabase
      .from('reflections')
      .upsert({ member_id: member.id, phase_id: phase.id, ...parsed.data }, { onConflict: 'member_id,phase_id' })
    setSaving(false)
    if (error) {
      setServerError(
        error.code === '42501'
          ? 'No tienes permiso para guardar esta reflexión. Solo puedes escribir las tuyas.'
          : 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',
      )
      return
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['reflections'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'reflections'] }),
      qc.invalidateQueries({ queryKey: ['phase_counts'] }),
      qc.invalidateQueries({ queryKey: ['participation'] }),
    ])
    onDone()
  }

  const name = member.name.replace(/\[[^\]]*\]/g, '').trim()

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-gold/40 bg-gold/5 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Modo edición</p>
        <h4 className="font-serif text-2xl font-semibold text-[var(--text)]">
          Reflexión de {name} · Fase {phase.id}
        </h4>
        <p className="text-sm text-[var(--text-muted)]">Puedes guardar aunque dejes algún campo vacío y completarlo después.</p>
      </div>

      {REFLECTION_FIELDS.map(({ key, title }) => (
        <div key={key}>
          <label htmlFor={`ref-${key}`} className="block text-sm font-medium text-[var(--text)]">
            {title}
          </label>
          <textarea
            id={`ref-${key}`}
            rows={4}
            value={values[key]}
            maxLength={4200}
            aria-invalid={!!errors[key]}
            aria-describedby={`ref-${key}-ayuda`}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--text)] outline-none focus:border-gold"
          />
          <p id={`ref-${key}-ayuda`} className={`mt-1 text-xs ${errors[key] ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
            {errors[key] ?? `${values[key].length} / 4000`}
          </p>
        </div>
      ))}

      {serverError && (
        <p role="alert" className="text-sm text-red-500">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#f5b942] px-6 py-2.5 font-semibold text-[#071426] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar reflexión'}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="rounded-full border border-[var(--border)] px-6 py-2.5 text-[var(--text)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
