import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { AccordionItem } from '../../../components/Accordion'
import { PhaseLocked } from '../../../components/PhaseLocked'
import { isPhaseLocked, opensOn } from '../../../lib/phases'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { useConfirm } from '../../../components/ui/Confirm'
import { useRole } from '../../../hooks/useAuth'
import { DOCX_MIME } from '../../../lib/fileValidation'
import { deleteRow, dropFile, updateRow, useAction, useAdminRows, useRefresh } from '../adminData'
import { PhaseUploader } from '../../learning/PhaseUploader'
import { StatusBadge, formatDate, formatSize } from '../../learning/parts'
import type { Deliverable, Moment, Phase, PhaseStatus } from '../../../types'

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'entregada', label: 'Entregada' },
]

function PhaseEditor({ phase, deliverable }: { phase: Phase; deliverable: Deliverable | undefined }) {
  const { session, userName } = useRole()
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [f, setF] = useState({
    title: phase.title,
    rac: phase.rac,
    description: phase.description,
    start_date: phase.start_date ?? '',
    end_date: phase.end_date ?? '',
    opens_at: phase.opens_at ?? '',
    status: phase.status as PhaseStatus,
    que_aprendimos: phase.que_aprendimos,
  })
  const [errors, setErrors] = useState<{ title?: string; dates?: string }>({})
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    const e: typeof errors = {}
    if (!f.title.trim()) e.title = 'El título es obligatorio.'
    if (f.start_date && f.end_date && f.end_date < f.start_date) e.dates = 'La fecha final no puede ser anterior a la inicial.'
    setErrors(e)
    if (Object.keys(e).length) return
    await run('Fase guardada.', async () => {
      await updateRow('phases', phase.id, {
        title: f.title.trim(),
        rac: f.rac.trim(),
        description: f.description,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        opens_at: f.opens_at || null,
        status: f.status,
        que_aprendimos: f.que_aprendimos,
      })
      await refresh('phases')
    })
  }

  const removeDeliverable = async () => {
    if (!deliverable) return
    const ok = await confirm({
      title: '¿Eliminar el documento?',
      message: `Se borrará «${deliverable.file_name}» de la Fase ${phase.id}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar documento',
      danger: true,
    })
    if (!ok) return
    await run('Documento eliminado.', async () => {
      await deleteRow('phase_deliverables', deliverable.id)
      await dropFile('deliverables', deliverable.file_path)
      await refresh('phase_deliverables')
    })
  }

  const togglePublished = (v: boolean) =>
    deliverable &&
    run(v ? 'Documento publicado.' : 'Documento en borrador.', async () => {
      await updateRow('phase_deliverables', deliverable.id, { published: v })
      await refresh('phase_deliverables')
    })

  return (
    <div className="space-y-5 px-1 pb-5 pt-4 sm:px-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Título de la fase" value={f.title} onChange={set('title')} error={errors.title} required />
        <TextField label="RAC" value={f.rac} onChange={set('rac')} hint="Resultado de aprendizaje del curso, por ejemplo «RAC 2»." />
        <TextField label="Fecha de inicio" type="date" value={f.start_date} onChange={set('start_date')} />
        <TextField label="Fecha final" type="date" value={f.end_date} onChange={set('end_date')} error={errors.dates} />
        <TextField
          label="Se abre el"
          type="date"
          value={f.opens_at}
          onChange={set('opens_at')}
          hint="Hasta este día (hora de Bogotá) la fase está cerrada para todos. Déjalo vacío para abrirla ya."
        />
        <SelectField label="Estado" value={f.status} onChange={set('status')} options={STATUS_OPTIONS} />
      </div>
      <TextArea label="Descripción de la actividad" value={f.description} onChange={set('description')} rows={3} />
      <TextArea label="¿Qué aprendimos en esta fase?" value={f.que_aprendimos} onChange={set('que_aprendimos')} rows={4} />
      <Button loading={busy} onClick={save}>
        Guardar fase
      </Button>

      <div className="space-y-3 border-t border-[var(--border)] pt-5">
        <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Documento de entrega final</h4>
        {deliverable ? (
          <Card className="space-y-3">
            <div>
              <p className="break-words font-medium text-[var(--text)]">{deliverable.file_name}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {deliverable.mime_type === DOCX_MIME ? 'Word (.docx)' : 'PDF'} · {formatSize(deliverable.size_bytes)}
                {formatDate(deliverable.created_at) && ` · ${formatDate(deliverable.created_at)}`}
                {deliverable.uploaded_by_name && ` · ${deliverable.uploaded_by_name}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle checked={deliverable.published} onChange={togglePublished} />
              <Button variant="danger" onClick={removeDeliverable} disabled={busy}>
                <Trash2 size={16} aria-hidden /> Eliminar documento
              </Button>
            </div>
          </Card>
        ) : (
          <Notice>Aún no hay documento en esta fase.</Notice>
        )}
        {isPhaseLocked(phase) ? (
          <PhaseLocked phase={phase} compact />
        ) : (
          session && <PhaseUploader phaseId={phase.id} existing={deliverable} userId={session.user.id} userName={userName} />
        )}
      </div>
    </div>
  )
}

function MomentEditor({ moment }: { moment: Moment }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [title, setTitle] = useState(moment.title)
  const [description, setDescription] = useState(moment.description)
  const dirty = title !== moment.title || description !== moment.description
  return (
    <Card className="space-y-3">
      <TextField label={`Nombre del ${moment.id === 'inicial' ? 'primer' : moment.id === 'intermedio' ? 'segundo' : 'tercer'} momento`} value={title} onChange={setTitle} />
      <TextArea label="Descripción (opcional)" value={description} onChange={setDescription} rows={2} />
      <Button
        loading={busy}
        disabled={!dirty || !title.trim()}
        onClick={() =>
          run('Momento guardado.', async () => {
            await updateRow('moments', moment.id, { title: title.trim(), description })
            await refresh('moments')
          })
        }
      >
        Guardar momento
      </Button>
    </Card>
  )
}

export default function PhasesTab() {
  const { data: phases = [] } = useAdminRows<Phase>('phases')
  const { data: moments = [] } = useAdminRows<Moment>('moments')
  const { data: deliverables = [] } = useAdminRows<Deliverable>('phase_deliverables', [['created_at', true]])
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      <TabIntro title="Fases y entregas">
        Edita cada fase y sube o reemplaza el documento de entrega final (PDF o Word, máximo 20 MB). El tipo de archivo se comprueba por su contenido real.
      </TabIntro>

      <div className="space-y-3">
        {phases.map((p) => {
          const moment = moments.find((m) => m.id === p.moment_id)
          const d = deliverables.find((x) => x.phase_id === p.id)
          return (
            <AccordionItem
              key={p.id}
              id={`admin-fase-${p.id}`}
              open={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
              headingLevel={3}
              accent={moment?.color}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
              buttonClassName="p-4"
              header={
                <span className="block">
                  <span className="block font-serif text-xl font-semibold text-[var(--text)]">
                    Fase {p.id} – {p.title}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                    {isPhaseLocked(p) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs">
                        <Lock size={12} aria-hidden /> Cerrada · se abre el {opensOn(p)}
                      </span>
                    ) : (
                      <>
                        <StatusBadge status={p.status} />
                        <span>{d ? (d.published ? 'Con documento publicado' : 'Documento en borrador') : 'Sin documento'}</span>
                      </>
                    )}
                  </span>
                </span>
              }
            >
              <PhaseEditor phase={p} deliverable={d} />
            </AccordionItem>
          )
        })}
      </div>

      <h3 className="mb-3 mt-10 font-serif text-2xl font-semibold text-[var(--text)]">Momentos</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {moments.map((m) => (
          <MomentEditor key={m.id + m.title + m.description} moment={m} />
        ))}
      </div>
    </div>
  )
}
