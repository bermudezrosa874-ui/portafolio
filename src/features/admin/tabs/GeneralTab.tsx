import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { z } from '../../../lib/zod'
import { Button, Card, TabIntro, TextArea, TextField } from '../../../components/ui/forms'
import { updateRow, useAction, useAdminRows, useRefresh } from '../adminData'
import type { SiteConfig } from '../../../types'

const required = (label: string) => z.string().trim().min(1, `${label} es obligatorio.`).max(300, 'Máximo 300 caracteres.')
const long = z.string().max(4000, 'Máximo 4000 caracteres.')
const schema = z.object({
  title: required('El nombre'),
  subtitle: required('El subtítulo'),
  motto: required('El lema'),
  course: required('La asignatura'),
  university: required('La universidad'),
  center: z.string().max(300),
  program: required('El programa'),
  teacher: z.string().max(300),
  period: z.string().max(300),
  group_name: z.string().max(300),
  intro_text: long,
  purpose: long,
  general_objective: long,
  specific_objectives: z.array(z.string().trim().min(1, 'Un objetivo está vacío.').max(500)).max(8),
  timeline_text: long,
  timeline_learned: long,
  videos_intro: long,
  group_reflection: long,
  reflection_knowledge: long,
  reflection_skills: long,
  reflection_experience: long,
  team_text: long,
})

type Errors = Partial<Record<keyof SiteConfig, string>>

function Form({ cfg }: { cfg: SiteConfig }) {
  const [f, setF] = useState<SiteConfig>(cfg)
  const [errors, setErrors] = useState<Errors>({})
  const { busy, run } = useAction()
  const refresh = useRefresh()
  const dirty = JSON.stringify(f) !== JSON.stringify(cfg)

  const set = <K extends keyof SiteConfig>(k: K) => (v: SiteConfig[K]) => setF((s) => ({ ...s, [k]: v }))
  const text = (k: keyof SiteConfig, label: string, extra: { area?: boolean; rows?: number; hint?: string } = {}) => {
    const value = String(f[k] ?? '')
    return extra.area ? (
      <TextArea label={label} value={value} onChange={set(k) as (v: string) => void} rows={extra.rows ?? 4} error={errors[k]} hint={extra.hint} />
    ) : (
      <TextField label={label} value={value} onChange={set(k) as (v: string) => void} error={errors[k]} hint={extra.hint} />
    )
  }

  const save = async () => {
    const parsed = schema.safeParse(f)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof SiteConfig] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    await run('Datos generales guardados.', async () => {
      await updateRow('site_config', 1, parsed.data)
      await refresh('site_config')
    })
  }

  const objectives = f.specific_objectives

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Portada</h3>
        {text('title', 'Nombre del portafolio')}
        {text('subtitle', 'Subtítulo')}
        {text('motto', 'Lema')}
        {text('intro_text', 'Texto introductorio', { area: true })}
      </Card>

      <Card className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Curso</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('course', 'Asignatura')}
          {text('program', 'Programa')}
          {text('university', 'Universidad')}
          {text('center', 'Centro')}
          {text('teacher', 'Docente')}
          {text('period', 'Periodo académico')}
          {text('group_name', 'Grupo')}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Sobre el portafolio</h3>
        {text('purpose', 'Propósito', { area: true })}
        {text('general_objective', 'Objetivo general', { area: true, rows: 3 })}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[var(--text)]">Objetivos específicos</legend>
          {objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <TextArea
                  label={`Objetivo ${i + 1}`}
                  rows={2}
                  value={o}
                  onChange={(v) => set('specific_objectives')(objectives.map((x, j) => (j === i ? v : x)))}
                />
              </div>
              <Button
                variant="secondary"
                className="mt-6 !px-3"
                aria-label={`Quitar objetivo ${i + 1}`}
                onClick={() => set('specific_objectives')(objectives.filter((_, j) => j !== i))}
              >
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
          ))}
          {errors.specific_objectives && <p className="text-sm text-red-500">{errors.specific_objectives}</p>}
          <Button variant="secondary" disabled={objectives.length >= 8} onClick={() => set('specific_objectives')([...objectives, ''])}>
            <Plus size={16} aria-hidden /> Agregar objetivo
          </Button>
        </fieldset>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Línea de tiempo y videos</h3>
        {text('timeline_text', 'Texto de la línea de tiempo', { area: true })}
        {text('timeline_learned', '«¿Qué aprendimos?» de la línea de tiempo', { area: true, rows: 3 })}
        {text('videos_intro', 'Texto de «Voces de la historia»', { area: true })}
      </Card>

      <Card className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Lo que aprendimos y equipo</h3>
        {text('group_reflection', 'Reflexión grupal', { area: true })}
        <div className="grid gap-4 md:grid-cols-3">
          {text('reflection_knowledge', 'Conocimiento', { area: true, rows: 5 })}
          {text('reflection_skills', 'Habilidades', { area: true, rows: 5 })}
          {text('reflection_experience', 'Experiencia', { area: true, rows: 5 })}
        </div>
        {text('team_text', 'Texto de «Nuestro equipo»', { area: true, rows: 3 })}
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
        <Button loading={busy} disabled={!dirty} onClick={save}>
          Guardar cambios
        </Button>
        <Button variant="secondary" disabled={!dirty || busy} onClick={() => setF(cfg)}>
          Descartar
        </Button>
        <span className="text-sm text-[var(--text-muted)]" aria-live="polite">
          {dirty ? 'Hay cambios sin guardar.' : 'Todo guardado.'}
        </span>
      </div>
    </div>
  )
}

export default function GeneralTab() {
  const { data, isLoading, isError } = useAdminRows<SiteConfig>('site_config', [['id', true]])
  const cfg = data?.[0]
  return (
    <div>
      <TabIntro title="Datos generales">Textos de la portada, el curso, los objetivos y las reflexiones. Los cambios se ven en el portafolio al guardar.</TabIntro>
      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}
      {isError && <p className="text-red-500">No se pudieron cargar los datos.</p>}
      {cfg && <Form key={JSON.stringify(cfg).length + String(cfg.id)} cfg={cfg} />}
    </div>
  )
}
