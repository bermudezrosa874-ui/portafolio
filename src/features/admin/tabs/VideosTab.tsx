import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { SortableList } from '../../../components/ui/SortableList'
import { useConfirm } from '../../../components/ui/Confirm'
import { PLATFORM_LABEL, resolveEmbed } from '../../../lib/embed'
import { deleteRow, insertRow, persistOrder, updateRow, useAction, useAdminRows, useRefresh } from '../adminData'
import { EmbedField, deriveEmbed } from '../EmbedField'
import { VideoCard } from '../../videos/VideoCard'
import type { BehindScenes, Phase, Video } from '../../../types'

type Row = Video & { published: boolean }

const BEHIND: [keyof BehindScenes, string][] = [
  ['como_se_hizo', 'Cómo se realizó'],
  ['que_investigaron', 'Qué investigaron'],
  ['herramientas', 'Herramientas usadas'],
  ['dificultades', 'Dificultades'],
  ['aprendizajes', 'Aprendizajes'],
]

function VideoForm({ initial, nextPosition, phases, onClose, defaultPublished, taken }: { initial: Row | null; nextPosition: number; phases: Phase[]; onClose: () => void; defaultPublished: boolean; taken: Record<number, string> }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [f, setF] = useState({
    title: initial?.title ?? '',
    url: initial?.url ?? '',
    participants: initial?.participants ?? '',
    duration: initial?.duration ?? '',
    description: initial?.description ?? '',
    credits: initial?.credits ?? '',
    phase_id: initial?.phase_id ? String(initial.phase_id) : '',
    published: initial?.published ?? defaultPublished,
  })
  const [behind, setBehind] = useState<BehindScenes>(initial?.behind_scenes ?? {})
  const [touched, setTouched] = useState(false)
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const info = resolveEmbed(f.url)
  const urlError = touched && !info.valid ? 'El enlace no es válido: debe empezar por https://.' : undefined
  const durationError = f.duration && !/^\d{1,2}(:\d{2}){1,2}$/.test(f.duration.trim()) ? 'Usa el formato mm:ss, por ejemplo 06:42.' : undefined

  const cleanBehind = Object.fromEntries(Object.entries(behind).filter(([, v]) => v && v.trim())) as BehindScenes

  const save = async () => {
    setTouched(true)
    if (!f.title.trim() || !info.valid || durationError || !f.phase_id) return
    const d = deriveEmbed(f.url)
    const payload = {
      title: f.title.trim(),
      url: info.openUrl,
      embed_url: d.embed_url,
      platform: d.platform,
      thumbnail_url: d.thumbnail_url,
      participants: f.participants.trim(),
      duration: f.duration.trim(),
      description: f.description.trim(),
      credits: f.credits.trim(),
      behind_scenes: cleanBehind,
      phase_id: f.phase_id ? Number(f.phase_id) : null,
      published: f.published,
    }
    const ok = await run(initial ? 'Video actualizado.' : 'Video agregado.', async () => {
      if (initial) await updateRow('videos', initial.id, payload)
      else await insertRow('videos', { ...payload, position: nextPosition })
      await refresh('videos')
      return true
    })
    if (ok) onClose()
  }

  const phaseOptions = [
    { value: '', label: 'Elige la fase…', disabled: true },
    ...phases.map((p) => {
      const busy = !!taken[p.id] && p.id !== initial?.phase_id
      return { value: String(p.id), label: `Fase ${p.id}: ${p.title}`, busy }
    }).filter((o) => !o.busy),
  ]
  const previewVideo: Video = {
    id: 'preview',
    title: f.title || 'Título del video',
    url: f.url,
    embed_url: null,
    platform: info.valid ? PLATFORM_LABEL[info.platform] : null,
    thumbnail_url: info.thumbnail,
    participants: f.participants,
    duration: f.duration,
    description: f.description,
    credits: f.credits,
    behind_scenes: cleanBehind,
    phase_id: f.phase_id ? Number(f.phase_id) : null,
    position: 0,
  }

  return (
    <Card className="space-y-4 border-gold/40">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">{initial ? 'Editar video' : 'Agregar video'}</h3>
      <Notice tone="warn">
        <strong>Subtítulos:</strong> antes de publicar, activa los subtítulos en la plataforma donde está el video (por ejemplo, en YouTube Studio → Subtítulos). Así lo pueden ver todas las personas.
      </Notice>
      <TextField label="Título" value={f.title} onChange={set('title')} required maxLength={150} error={touched && !f.title.trim() ? 'El título es obligatorio.' : undefined} />
      <EmbedField label="Enlace del video" url={f.url} onUrl={set('url')} hint="YouTube, Vimeo, Google Drive, Canva u OneDrive." />
      {urlError && <p className="text-sm text-red-500">{urlError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Participantes" value={f.participants} onChange={set('participants')} maxLength={300} />
        <TextField label="Duración" value={f.duration} onChange={set('duration')} placeholder="06:42" error={durationError} />
      </div>
      <TextArea label="Descripción" value={f.description} onChange={set('description')} rows={3} maxLength={1000} />
      <TextField label="Créditos" value={f.credits} onChange={set('credits')} maxLength={300} />
      <SelectField label="Fase" value={f.phase_id} onChange={set('phase_id')} options={phaseOptions} required error={touched && !f.phase_id ? 'Elige la fase.' : undefined} hint="Cada fase tiene un solo video o entrevista." />

      <fieldset className="space-y-3 rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-sm font-medium text-[var(--text)]">«Detrás de la entrevista» (opcional)</legend>
        {BEHIND.map(([key, label]) => (
          <TextArea key={key} label={label} rows={2} value={behind[key] ?? ''} onChange={(v) => setBehind((b) => ({ ...b, [key]: v }))} maxLength={1000} />
        ))}
      </fieldset>

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--text)]">Vista previa</p>
        <div className="max-w-md bg-[#04070d] p-3">
          <VideoCard video={previewVideo} phaseLabel={f.phase_id ? `Fase ${f.phase_id}` : null} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Toggle checked={f.published} onChange={set('published')} />
        <Button loading={busy} onClick={save}>
          {initial ? 'Guardar cambios' : 'Agregar video'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}

/** ownerId: modo colaborador (solo ve y maneja lo que subió él). Sin ownerId: la administradora, que maneja todo. */
export default function VideosTab({ ownerId }: { ownerId?: string }) {
  const { data: all = [], isLoading } = useAdminRows<Row>('videos', [['position', true], ['created_at', true]])
  const rows = ownerId ? all.filter((r) => r.uploaded_by === ownerId) : all
  const taken: Record<number, string> = {}
  for (const r of all) if (r.phase_id) taken[r.phase_id] = r.uploaded_by_name || 'otro integrante'
  const { data: phases = [] } = useAdminRows<Phase>('phases')
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const remove = async (v: Row) => {
    const ok = await confirm({
      title: '¿Eliminar este video?',
      message: `Se eliminará «${v.title}» del portafolio. El video original no se borra de su plataforma.`,
      confirmLabel: 'Eliminar video',
      danger: true,
    })
    if (!ok) return
    await run('Video eliminado.', async () => {
      await deleteRow('videos', v.id)
      await refresh('videos')
    })
  }

  return (
    <div className="space-y-5">
      <TabIntro title="Videos y entrevistas">Agrega varios videos pegando su enlace: se detecta la plataforma y se genera el formato correcto.</TabIntro>

      {editing === null && (
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Agregar video
        </Button>
      )}

      {editing !== null && (
        <VideoForm taken={taken} defaultPublished={!!ownerId} key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} nextPosition={Math.max(0, ...rows.map((r) => r.position)) + 1} phases={phases} onClose={() => setEditing(null)} />
      )}

      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}
      {!isLoading && rows.length === 0 && editing === null && <Notice>Aún no hay videos.</Notice>}

      <SortableList
        items={rows}
        nameOf={(v) => v.title}
        onReorder={(ids) =>
          run('Orden guardado.', async () => {
            await persistOrder('videos', ids)
            await refresh('videos')
          })
        }
        render={(v) => (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--text)]">{v.title}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {v.platform ?? 'Enlace'} · {v.duration || 'sin duración'} · {v.phase_id ? `Fase ${v.phase_id}` : 'Sin fase'} ·{' '}
                <span className={v.published ? 'text-emerald-500' : 'text-[#f5b942]'}>{v.published ? 'Publicado' : 'Borrador'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(v)} aria-label={`Editar ${v.title}`}>
                <Pencil size={15} aria-hidden /> Editar
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => remove(v)} aria-label={`Eliminar ${v.title}`}>
                <Trash2 size={15} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
