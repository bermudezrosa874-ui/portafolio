import { useState } from 'react'
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { Dropzone } from '../../../components/ui/Dropzone'
import { SortableList } from '../../../components/ui/SortableList'
import { useConfirm } from '../../../components/ui/Confirm'
import { resolveEmbed } from '../../../lib/embed'
import { validateImage } from '../../../lib/fileValidation'
import { processSingle } from '../../../lib/image'
import { publicUrl } from '../../../lib/upload'
import {
  deleteRow,
  dropFile,
  insertRow,
  persistOrder,
  updateRow,
  uploadImage,
  useAction,
  useAdminRows,
  useRefresh,
} from '../adminData'
import { EmbedField, deriveEmbed } from '../EmbedField'
import { KIND_META, ResourceCard } from '../../resources/ResourceCard'
import type { Phase, Resource } from '../../../types'

type Row = Resource & { published: boolean }

const KIND_OPTIONS = (Object.keys(KIND_META) as (keyof typeof KIND_META)[]).map((k) => ({ value: k, label: KIND_META[k].label }))

function urlErrorOf(url: string): string | undefined {
  if (!url.trim()) return 'Pega el enlace del recurso.'
  return resolveEmbed(url).valid ? undefined : 'El enlace no es válido: debe empezar por https://.'
}

function TimelineEditor({ row, defaultPublished }: { row: Row | undefined; defaultPublished: boolean }) {
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [title, setTitle] = useState(row?.title ?? 'Línea de tiempo')
  const [url, setUrl] = useState(row?.url ?? '')
  const [published, setPublished] = useState(row?.published ?? defaultPublished)
  const [touched, setTouched] = useState(false)
  const urlError = touched ? urlErrorOf(url) : undefined

  const save = async () => {
    setTouched(true)
    const info = resolveEmbed(url)
    if (!title.trim() || !info.valid) return
    const payload = { kind: 'timeline', title: title.trim(), url: info.openUrl, embed_url: info.embedUrl, published }
    await run('Línea de tiempo guardada.', async () => {
      if (row) await updateRow('resources', row.id, payload)
      else await insertRow('resources', { ...payload, position: 0 })
      await refresh('resources')
    })
  }
  const remove = async () => {
    if (!row) return
    const ok = await confirm({
      title: '¿Quitar la línea de tiempo?',
      message: 'Se eliminará el enlace de la línea de tiempo. Podrás agregar otro después.',
      confirmLabel: 'Quitar',
      danger: true,
    })
    if (!ok) return
    await run('Línea de tiempo eliminada.', async () => {
      await deleteRow('resources', row.id)
      setUrl('')
      await refresh('resources')
    })
  }

  return (
    <Card className="space-y-4">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Línea de tiempo</h3>
      <p className="text-sm text-[var(--text-muted)]">Genially, Canva, Prezi, TimelineJS u otra. Se muestra en la sección «Línea de tiempo».</p>
      <TextField label="Título" value={title} onChange={setTitle} required />
      <EmbedField label="Enlace de la línea de tiempo" url={url} onUrl={setUrl} />
      {urlError && <p className="text-sm text-red-500">{urlError}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Toggle checked={published} onChange={setPublished} />
        <Button loading={busy} onClick={save}>
          Guardar línea de tiempo
        </Button>
        {row && (
          <Button variant="danger" onClick={remove} disabled={busy}>
            <Trash2 size={16} aria-hidden /> Quitar
          </Button>
        )}
      </div>
    </Card>
  )
}

function ResourceForm({ initial, nextPosition, phases, onClose, defaultPublished, taken }: { initial: Row | null; nextPosition: number; phases: Phase[]; onClose: () => void; defaultPublished: boolean; taken: Record<number, string> }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [f, setF] = useState({
    title: initial?.title ?? '',
    kind: (initial?.kind ?? 'infografia') as keyof typeof KIND_META,
    url: initial?.url ?? '',
    description: initial?.description ?? '',
    phase_id: initial?.phase_id ? String(initial.phase_id) : '',
    cover_path: initial?.cover_path ?? null,
    published: initial?.published ?? defaultPublished,
  })
  const [touched, setTouched] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const urlError = touched ? urlErrorOf(f.url) : undefined

  const onCover = async (files: File[]) => {
    setCoverError(null)
    const file = files[0]
    const check = await validateImage(file)
    if (!check.ok) return setCoverError(check.error)
    try {
      setProgress(0)
      const img = await processSingle(file, 1280)
      const path = await uploadImage('covers', '', img, setProgress)
      if (f.cover_path && f.cover_path !== initial?.cover_path) await dropFile('covers', f.cover_path)
      set('cover_path')(path)
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'No se pudo subir la portada.')
    } finally {
      setProgress(null)
    }
  }

  const save = async () => {
    setTouched(true)
    const info = resolveEmbed(f.url)
    if (!f.title.trim() || !info.valid || !f.phase_id) return
    const payload = {
      kind: f.kind,
      title: f.title.trim(),
      url: info.openUrl,
      embed_url: deriveEmbed(f.url).embed_url,
      cover_path: f.cover_path,
      description: f.description.trim(),
      phase_id: f.phase_id ? Number(f.phase_id) : null,
      published: f.published,
    }
    const ok = await run(initial ? 'Recurso actualizado.' : 'Recurso agregado.', async () => {
      if (initial) {
        await updateRow('resources', initial.id, payload)
        if (initial.cover_path && initial.cover_path !== f.cover_path) await dropFile('covers', initial.cover_path)
      } else {
        await insertRow('resources', { ...payload, position: nextPosition })
      }
      await refresh('resources')
      return true
    })
    if (ok) onClose()
  }

  const info = resolveEmbed(f.url)
  const phaseOptions = [
    { value: '', label: 'Elige la fase…', disabled: true },
    ...phases.map((p) => {
      const busy = !!taken[p.id] && p.id !== initial?.phase_id
      return { value: String(p.id), label: `Fase ${p.id}: ${p.title}`, busy }
    }).filter((o) => !o.busy),
  ]

  return (
    <Card className="space-y-4 border-gold/40">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">{initial ? 'Editar recurso' : 'Agregar recurso'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Título" value={f.title} onChange={set('title')} error={touched && !f.title.trim() ? 'El título es obligatorio.' : undefined} required maxLength={150} />
        <SelectField label="Tipo" value={f.kind} onChange={(v) => set('kind')(v as keyof typeof KIND_META)} options={KIND_OPTIONS} />
      </div>
      <EmbedField label="Enlace del recurso" url={f.url} onUrl={set('url')} />
      {urlError && <p className="text-sm text-red-500">{urlError}</p>}
      <TextArea label="Descripción breve" value={f.description} onChange={set('description')} rows={3} maxLength={500} />
      <SelectField label="Fase" value={f.phase_id} onChange={set('phase_id')} options={phaseOptions} required error={touched && !f.phase_id ? 'Elige la fase.' : undefined} hint="Cada fase tiene un solo recurso digital." />

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Portada (opcional)</p>
        {f.cover_path && (
          <div className="flex items-center gap-3">
            <img src={publicUrl('covers', f.cover_path)} alt="Portada actual" className="h-20 w-32 rounded-lg object-cover" />
            <Button variant="secondary" onClick={() => set('cover_path')(null)}>
              Quitar portada
            </Button>
          </div>
        )}
        <Dropzone accept="image/jpeg,image/png,image/webp" onFiles={onCover} label="Arrastra una imagen de portada" hint="JPG, PNG o WebP, máx. 8 MB. Se comprime sola." disabled={progress !== null} />
        {progress !== null && <p className="text-sm text-[var(--text-muted)]" role="status">Subiendo portada… {Math.round(progress * 100)} %</p>}
        {coverError && <p role="alert" className="text-sm text-red-500">{coverError}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--text)]">Vista previa</p>
        <ul aria-hidden className="pointer-events-none max-w-sm">
          <ResourceCard
            resource={{ id: 'preview', kind: f.kind, title: f.title || 'Título del recurso', url: f.url, embed_url: null, cover_path: f.cover_path, description: f.description, phase_id: null, position: 0 }}
            number={initial ? 1 : nextPosition}
            info={info}
            phaseLabel={f.phase_id ? `Fase ${f.phase_id}` : null}
            onOpen={() => undefined}
          />
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Toggle checked={f.published} onChange={set('published')} />
        <Button loading={busy} disabled={progress !== null} onClick={save}>
          {progress !== null ? 'Subiendo portada…' : initial ? 'Guardar cambios' : 'Agregar recurso'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}

/** ownerId: modo colaborador (solo ve y maneja lo que subió él). Sin ownerId: la administradora, que maneja todo. */
export default function ResourcesTab({ ownerId }: { ownerId?: string }) {
  const { data: rows = [], isLoading } = useAdminRows<Row>('resources', [['position', true], ['created_at', true]])
  const { data: phases = [] } = useAdminRows<Phase>('phases')
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const timeline = rows.find((r) => r.kind === 'timeline')
  const resources = rows.filter((r) => r.kind !== 'timeline' && (!ownerId || r.uploaded_by === ownerId))
  // La línea de tiempo es una sola: un colaborador solo puede cambiarla si la subió él o si todavía no existe.
  const taken: Record<number, string> = {}
  for (const r of rows) if (r.kind !== 'timeline' && r.phase_id) taken[r.phase_id] = r.uploaded_by_name || 'otro integrante'
  const canEditTimeline = !ownerId || !timeline || timeline.uploaded_by === ownerId
  const phaseLabel = (id: number | null) => (id ? `Fase ${id}` : 'Sin fase')

  const remove = async (r: Row) => {
    const ok = await confirm({
      title: '¿Eliminar este recurso?',
      message: `Se eliminará «${r.title}». Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar recurso',
      danger: true,
    })
    if (!ok) return
    await run('Recurso eliminado.', async () => {
      await deleteRow('resources', r.id)
      await dropFile('covers', r.cover_path)
      await refresh('resources')
    })
  }

  return (
    <div className="space-y-8">
      <TabIntro title="Línea de tiempo y recursos">Enlaces a recursos interactivos. Se abren incrustados o en una pestaña nueva según la plataforma.</TabIntro>

      {isLoading ? (
        <p className="text-[var(--text-muted)]">Cargando…</p>
      ) : canEditTimeline ? (
        <TimelineEditor key={timeline?.id ?? 'none'} row={timeline} defaultPublished={!!ownerId} />
      ) : (
        <Notice>La línea de tiempo ya la subió {timeline?.uploaded_by_name || 'otro integrante'}. Solo esa persona o la administradora pueden cambiarla.</Notice>
      )}

      <section aria-labelledby="lista-recursos" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="lista-recursos" className="font-serif text-2xl font-semibold text-[var(--text)]">
            Recursos interactivos ({resources.length})
          </h3>
          {editing === null && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> Agregar recurso
            </Button>
          )}
        </div>

        {editing !== null && (
          <ResourceForm
            taken={taken}
            defaultPublished={!!ownerId}
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            nextPosition={Math.max(0, ...resources.map((r) => r.position)) + 1}
            phases={phases}
            onClose={() => setEditing(null)}
          />
        )}

        {resources.length === 0 && editing === null && <Notice>Aún no hay recursos. Usa «Agregar recurso» para crear el primero.</Notice>}

        <SortableList
          items={resources}
          nameOf={(r) => r.title}
          onReorder={(ids) =>
            run('Orden guardado.', async () => {
              await persistOrder('resources', ids)
              await refresh('resources')
            })
          }
          render={(r, i) => (
            <div className="flex flex-wrap items-center gap-3">
              {r.cover_path ? (
                <img src={publicUrl('covers', r.cover_path)} alt="" className="h-14 w-20 rounded-lg object-cover" />
              ) : (
                <span className="grid h-14 w-20 place-items-center rounded-lg bg-[var(--border)] text-[var(--text-muted)]">
                  <ImageOff size={20} aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--text)]">
                  <span className="text-[var(--text-muted)]">Recurso {String(i + 1).padStart(2, '0')} · </span>
                  {r.title}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {KIND_META[r.kind as keyof typeof KIND_META]?.label ?? r.kind} · {phaseLabel(r.phase_id)} ·{' '}
                  <span className={r.published ? 'text-emerald-500' : 'text-[#f5b942]'}>{r.published ? 'Publicado' : 'Borrador'}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(r)} aria-label={`Editar ${r.title}`}>
                  <Pencil size={15} aria-hidden /> Editar
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => remove(r)} aria-label={`Eliminar ${r.title}`}>
                  <Trash2 size={15} aria-hidden />
                </Button>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  )
}
