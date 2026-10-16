import { useState } from 'react'
import { Link2, Upload } from 'lucide-react'
import { Dropzone } from '../../components/ui/Dropzone'
import { Button, Card, SelectField, TextArea, TextField } from '../../components/ui/forms'
import { friendlyError } from '../admin/adminData'
import { useToast } from '../../components/ui/Toast'
import { useLearningData } from '../../lib/queries'
import { createContribution, reviewContribution, updateContribution, useRefreshContributions } from './api'
import {
  CATEGORY_LABEL,
  CONTRIBUTION_ACCEPT,
  KindIcon,
  STATUS_LABEL,
  fmtSize,
  validateContributionFile,
  type Contribution,
  type ContributionCategory,
  type ContributionStatus,
  type ValidatedContribution,
} from './model'

type Ok = Extract<ValidatedContribution, { ok: true }>

interface Props {
  userId: string
  isAdmin: boolean
  /** Si viene, se edita ese aporte (solo datos; el archivo se cambia con «Reemplazar»). */
  initial?: Contribution
  /** Fase que viene preseleccionada al subir desde «Mis fases». */
  defaultPhase?: number
  onDone: () => void
  onCancel?: () => void
}

const CATEGORIES = (Object.keys(CATEGORY_LABEL) as ContributionCategory[]).map((value) => ({ value, label: CATEGORY_LABEL[value] }))

/** Subir o editar un aporte. Quien sube NO elige «publicado»: eso lo decide la administradora. */
export function ContributionForm({ userId, isAdmin, initial, defaultPhase, onDone, onCancel }: Props) {
  const toast = useToast()
  const refresh = useRefreshContributions()
  const { data: learning } = useLearningData()
  const editing = !!initial

  const [mode, setMode] = useState<'file' | 'link'>(initial && !initial.file_path ? 'link' : 'file')
  const [file, setFile] = useState<{ file: File; check: Ok } | null>(null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<ContributionCategory>(initial?.category ?? 'otros')
  const [phase, setPhase] = useState(initial?.phase_id ? String(initial.phase_id) : defaultPhase ? String(defaultPhase) : '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [status, setStatus] = useState<ContributionStatus>(initial?.status ?? (isAdmin ? 'published' : 'pending_review'))
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pick = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const check = await validateContributionFile(f)
    if (!check.ok) return setErrors((e) => ({ ...e, file: check.error }))
    setErrors((e) => ({ ...e, file: '' }))
    setFile({ file: f, check })
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const submit = async (nextStatus: ContributionStatus) => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Escribe un título.'
    if (!editing && mode === 'file' && !file) errs.file = 'Elige un archivo.'
    if (mode === 'link' && !/^https?:\/\/\S+$/i.test(url.trim())) errs.url = 'Escribe un enlace que empiece por https://'
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const input = {
      title: title.trim(),
      description: description.trim(),
      category,
      kind: initial?.kind ?? ('enlace' as const),
      url: mode === 'link' ? url.trim() : null,
      phase_id: phase ? Number(phase) : null,
      status: nextStatus,
    }
    setBusy(true)
    try {
      let reviewId: string | null = null
      if (initial) {
        const { kind: _kind, ...patch } = input
        // El archivo adjunto no se toca aquí: solo los datos del aporte.
        await updateContribution(initial.id, initial.file_path ? { ...patch, url: null } : patch)
        if (!isAdmin && nextStatus === 'pending_review') reviewId = initial.id
      } else {
        const newId = await createContribution(userId, input, mode === 'file' ? file : null, setProgress)
        if (!isAdmin && nextStatus === 'pending_review') reviewId = newId
      }
      await refresh()
      if (reviewId) {
        // Un revisor automático lee el aporte: si está bien se publica solo; si no, queda pendiente con el motivo.
        const r = await reviewContribution(reviewId)
        await refresh()
        if (r.status === 'published') toast('ok', '¡Publicado! Tu aporte ya está en el portafolio.')
        else toast('info', `Aún no se publicó: ${r.note ?? 'La administradora lo revisará.'}`)
      } else {
        toast('ok', editing ? 'Cambios guardados.' : nextStatus === 'draft' ? 'Guardado como borrador.' : 'Aporte guardado.')
      }
      onDone()
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const statusOptions = (Object.keys(STATUS_LABEL) as ContributionStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] }))

  return (
    <Card className="space-y-5 border-pink-300/30 bg-gradient-to-br from-sky-400/10 via-transparent to-pink-400/10">
      <h2 className="font-serif text-2xl font-semibold text-[var(--text)]">{editing ? 'Editar aporte' : 'Subir nuevo recurso'}</h2>

      {!editing && (
        <div role="group" aria-label="Tipo de aporte" className="flex gap-2">
          {(
            [
              ['file', 'Archivo', Upload],
              ['link', 'Enlace', Link2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                mode === id ? 'border-violet-300 bg-violet-400/25 font-semibold text-[var(--text)]' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)]'
              }`}
            >
              <Icon size={15} aria-hidden /> {label}
            </button>
          ))}
        </div>
      )}

      {!editing && mode === 'file' && (
        <div className="space-y-2">
          <Dropzone
            accept={CONTRIBUTION_ACCEPT}
            label="Arrastra tu archivo aquí"
            hint="PDF, Word, PowerPoint, imágenes JPG/PNG/WebP o video MP4/WebM · máximo 50 MB"
            onFiles={(f) => void pick(f)}
            disabled={busy}
          />
          {file && (
            <p className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm text-[var(--text)]">
              <KindIcon kind={file.check.kind} size={18} /> {file.file.name} · {fmtSize(file.file.size)}
            </p>
          )}
          {errors.file && (
            <p role="alert" className="text-sm text-red-400">
              {errors.file}
            </p>
          )}
        </div>
      )}

      {mode === 'link' && (
        <TextField label="Enlace" value={url} onChange={setUrl} error={errors.url} required placeholder="https://…" hint="Puede ser un video, una presentación en línea o un documento compartido." />
      )}

      <TextField label="Título" value={title} onChange={setTitle} error={errors.title} required maxLength={160} />
      <TextArea label="Descripción" value={description} onChange={setDescription} rows={3} maxLength={2000} hint="Cuenta brevemente de qué trata este aporte." />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Categoría" value={category} onChange={(v) => setCategory(v as ContributionCategory)} options={CATEGORIES} />
        <SelectField
          label="Fase relacionada"
          value={phase}
          onChange={setPhase}
          options={[{ value: '', label: 'Ninguna' }, ...(learning?.phases ?? []).map((p) => ({ value: String(p.id), label: `Fase ${p.id}` }))]}
        />
      </div>

      {isAdmin && <SelectField label="Estado" value={status} onChange={(v) => setStatus(v as ContributionStatus)} options={statusOptions} />}

      {busy && !editing && mode === 'file' && (
        <div role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isAdmin || editing ? (
          <Button loading={busy} onClick={() => void submit(isAdmin ? status : (initial?.status === 'draft' ? 'draft' : 'pending_review'))}>
            {editing ? 'Guardar cambios' : 'Guardar aporte'}
          </Button>
        ) : (
          <>
            <Button loading={busy} onClick={() => void submit('pending_review')}>
              Publicar
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void submit('draft')}>
              Guardar como borrador
            </Button>
          </>
        )}
        {onCancel && (
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      {!isAdmin && editing && <p className="text-xs text-[var(--text-muted)]">Si cambias un aporte ya publicado, se revisa de nuevo automáticamente antes de volver a publicarse.</p>}
    </Card>
  )
}
