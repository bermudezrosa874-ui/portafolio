import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { Dropzone } from '../../../components/ui/Dropzone'
import { SortableList } from '../../../components/ui/SortableList'
import { useConfirm } from '../../../components/ui/Confirm'
import { useToast } from '../../../components/ui/Toast'
import { useRole } from '../../../hooks/useAuth'
import { validateImage } from '../../../lib/fileValidation'
import { processWithThumb } from '../../../lib/image'
import { isPhaseLocked } from '../../../lib/phases'
import { publicUrl } from '../../../lib/upload'
import { deleteRow, dropFile, insertRow, persistOrder, updateRow, uploadImage, useAction, useAdminRows, useRefresh } from '../adminData'
import { CATEGORY_LABEL } from '../../gallery/Lightbox'
import type { Evidence, EvidenceCategory, Member, Phase } from '../../../types'

type Row = Evidence & { published: boolean; created_by: string | null }

interface Fields {
  title: string
  description: string
  category: EvidenceCategory
  phase_id: string
  member_ids: string[]
  taken_on: string
}
interface Pending extends Fields {
  key: string
  file: File
  preview: string
  progress: number | null
  error?: string
}

const emptyFields: Fields = { title: '', description: '', category: 'otros', phase_id: '', member_ids: [], taken_on: '' }
const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as EvidenceCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))
const plain = (name: string) => name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante'

function FieldsEditor({
  value,
  onChange,
  phases,
  members,
  errors,
}: {
  value: Fields
  onChange: (v: Fields) => void
  phases: Phase[]
  members: Member[]
  errors?: { title?: string; description?: string }
}) {
  const set = <K extends keyof Fields>(k: K) => (v: Fields[K]) => onChange({ ...value, [k]: v })
  const phaseOptions = [{ value: '', label: 'Sin fase' }, ...phases.map((p) => ({ value: String(p.id), label: `Fase ${p.id}: ${p.title}${isPhaseLocked(p) ? ' (cerrada)' : ''}`, disabled: isPhaseLocked(p) }))]
  return (
    <div className="space-y-3">
      <TextField label="Título" value={value.title} onChange={set('title')} error={errors?.title} required maxLength={150} />
      <TextArea
        label="Descripción breve de lo que se hizo"
        value={value.description}
        onChange={set('description')}
        error={errors?.description}
        rows={3}
        required
        maxLength={600}
        hint="Por ejemplo: «Durante esta fase se investigó a los personajes y luego se elaboraron los guiones»."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Categoría" value={value.category} onChange={(v) => set('category')(v as EvidenceCategory)} options={CATEGORY_OPTIONS} />
        <SelectField label="Fase" value={value.phase_id} onChange={set('phase_id')} options={phaseOptions} />
      </div>
      <TextField label="Fecha" type="date" value={value.taken_on} onChange={set('taken_on')} />
      <fieldset>
        <legend className="text-sm font-medium text-[var(--text)]">Integrantes que participaron</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {members.map((m) => {
            const on = value.member_ids.includes(m.id)
            return (
              <label
                key={m.id}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${
                  on ? 'border-gold bg-gold/10 text-[var(--text)]' : 'border-[var(--border)] text-[var(--text)]'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#f5b942]"
                  checked={on}
                  onChange={() => set('member_ids')(on ? value.member_ids.filter((x) => x !== m.id) : [...value.member_ids, m.id])}
                />
                {plain(m.name)}
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

export default function GalleryTab({ memberMode = false }: { memberMode?: boolean }) {
  const { session } = useRole()
  const uid = session?.user.id ?? ''
  const toast = useToast()
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const { data: all = [] } = useAdminRows<Row>('evidences', [['position', true], ['created_at', false]])
  const { data: phases = [] } = useAdminRows<Phase>('phases')
  const { data: members = [] } = useAdminRows<Member>('members')

  const rows = memberMode ? all.filter((r) => r.created_by === uid) : all
  const [pending, setPending] = useState<Pending[]>([])
  const [errors, setErrors] = useState<Record<string, { title?: string; description?: string }>>({})
  const [uploading, setUploading] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [editing, setEditing] = useState<{ row: Row; fields: Fields; published: boolean } | null>(null)
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  // Libera las vistas previas al salir.
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  const authorOf = (r: Row) => members.find((m) => m.user_id === r.created_by)
  const toReview = !memberMode ? all.filter((r) => !r.published && authorOf(r)).length : 0

  const addFiles = async (files: File[]) => {
    const room = 20 - pending.length
    if (room <= 0) return toast('error', 'Máximo 20 imágenes por tanda. Sube estas y luego agrega más.')
    const added: Pending[] = []
    for (const file of files.slice(0, room)) {
      const check = await validateImage(file)
      if (!check.ok) {
        toast('error', `«${file.name}»: ${check.error}`)
        continue
      }
      added.push({ ...emptyFields, key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: null })
    }
    setPending((p) => [...p, ...added])
  }

  const patchPending = (key: string, patch: Partial<Pending>) => setPending((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const dropPending = (key: string) => {
    const item = pending.find((p) => p.key === key)
    if (item) URL.revokeObjectURL(item.preview)
    setPending((p) => p.filter((x) => x.key !== key))
  }

  const uploadAll = async () => {
    const errs: typeof errors = {}
    for (const p of pending) {
      const e: { title?: string; description?: string } = {}
      if (!p.title.trim()) e.title = 'Escribe un título.'
      if (!p.description.trim()) e.description = 'Describe brevemente lo que se hizo.'
      if (e.title || e.description) errs[p.key] = e
    }
    setErrors(errs)
    if (Object.keys(errs).length) return toast('error', 'Cada imagen necesita título y descripción antes de publicarse.')

    setUploading(true)
    let ok = 0
    let failed = 0
    const basePosition = Math.max(0, ...rows.map((r) => r.position))
    for (const [i, p] of [...pending].entries()) {
      try {
        const { main, thumb } = await processWithThumb(p.file)
        const mainPath = await uploadImage('evidences', uid, main, (f) => patchPending(p.key, { progress: f }))
        const thumbPath = await uploadImage('evidences', uid, thumb, undefined, '-t')
        try {
          await insertRow('evidences', {
            image_path: mainPath,
            thumb_path: thumbPath,
            title: p.title.trim(),
            description: p.description.trim(),
            category: p.category,
            phase_id: p.phase_id ? Number(p.phase_id) : null,
            member_ids: p.member_ids,
            taken_on: p.taken_on || null,
            width: main.width,
            height: main.height,
            position: memberMode ? 0 : basePosition + i + 1,
            published: memberMode ? false : publishNow,
            created_by: uid,
          })
        } catch (e) {
          await dropFile('evidences', mainPath)
          await dropFile('evidences', thumbPath)
          throw e
        }
        dropPending(p.key)
        ok++
      } catch (e) {
        failed++
        patchPending(p.key, { progress: null, error: e instanceof Error ? e.message : 'No se pudo subir esta imagen.' })
      }
    }
    setUploading(false)
    await refresh('evidences')
    if (ok) toast('ok', memberMode ? `${ok} ${ok === 1 ? 'evidencia enviada' : 'evidencias enviadas'} para revisión.` : `${ok} ${ok === 1 ? 'imagen subida' : 'imágenes subidas'}.`)
    if (failed) toast('error', `${failed} ${failed === 1 ? 'imagen no se pudo subir' : 'imágenes no se pudieron subir'}. Siguen en la lista para reintentar.`)
  }

  const saveEdit = async () => {
    if (!editing) return
    const { row, fields, published } = editing
    if (!fields.title.trim() || !fields.description.trim()) {
      setErrors({ edit: { title: fields.title.trim() ? undefined : 'Escribe un título.', description: fields.description.trim() ? undefined : 'Escribe una descripción.' } })
      return
    }
    setErrors({})
    const done = await run('Evidencia actualizada.', async () => {
      await updateRow('evidences', row.id, {
        title: fields.title.trim(),
        description: fields.description.trim(),
        category: fields.category,
        phase_id: fields.phase_id ? Number(fields.phase_id) : null,
        member_ids: fields.member_ids,
        taken_on: fields.taken_on || null,
        published,
      })
      await refresh('evidences')
      return true
    })
    if (done) setEditing(null)
  }

  const togglePublished = (r: Row, v: boolean) =>
    run(v ? 'Evidencia publicada.' : 'Evidencia en borrador.', async () => {
      await updateRow('evidences', r.id, { published: v })
      await refresh('evidences')
    })

  const remove = async (r: Row) => {
    const ok = await confirm({
      title: '¿Eliminar esta evidencia?',
      message: `Se eliminará «${r.title}» y su imagen. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar evidencia',
      danger: true,
    })
    if (!ok) return
    await run('Evidencia eliminada.', async () => {
      await deleteRow('evidences', r.id)
      await dropFile('evidences', r.image_path)
      await dropFile('evidences', r.thumb_path)
      await refresh('evidences')
    })
  }

  const canDelete = (r: Row) => !memberMode || !r.published

  return (
    <div className="space-y-6">
      <TabIntro title={memberMode ? 'Mis evidencias' : 'Galería académica'}>
        {memberMode
          ? 'Sube imágenes de tu trabajo (capturas, bocetos, grabaciones…). Se envían como borrador y la administración las revisa antes de publicarlas.'
          : 'Sube imágenes del trabajo colaborativo. Se comprimen a WebP (máx. 1920 px) y se genera una miniatura. Cada imagen exige título y descripción.'}
      </TabIntro>

      {toReview > 0 && <Notice tone="warn">Hay {toReview} {toReview === 1 ? 'evidencia enviada por un integrante' : 'evidencias enviadas por integrantes'} en borrador, pendientes de tu revisión.</Notice>}

      <Card className="space-y-4">
        <Dropzone accept="image/jpeg,image/png,image/webp" multiple onFiles={addFiles} disabled={uploading} label="Arrastra aquí tus imágenes o elígelas" hint="JPG, PNG o WebP · máx. 8 MB cada una · hasta 20 por tanda" />

        {pending.length > 0 && (
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p.key} className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-4 sm:flex-row">
                <img src={p.preview} alt={`Vista previa de ${p.file.name}`} className="h-40 w-full rounded-xl object-cover sm:w-48" />
                <div className="min-w-0 flex-1 space-y-2">
                  <FieldsEditor value={p} onChange={(v) => patchPending(p.key, v)} phases={phases} members={members} errors={errors[p.key]} />
                  {p.progress !== null && <p className="text-sm text-[var(--text-muted)]" role="status">Subiendo… {Math.round(p.progress * 100)} %</p>}
                  {p.error && <p role="alert" className="text-sm text-red-500">{p.error}</p>}
                  <Button variant="secondary" disabled={uploading} onClick={() => dropPending(p.key)}>
                    <X size={15} aria-hidden /> Quitar de la tanda
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
              {memberMode ? (
                <Notice>Tus imágenes se enviarán como borrador para que las apruebe la administración.</Notice>
              ) : (
                <Toggle checked={publishNow} onChange={setPublishNow} labelOn="Publicar al subir" labelOff="Subir como borrador" />
              )}
              <Button loading={uploading} onClick={uploadAll}>
                Subir {pending.length} {pending.length === 1 ? 'imagen' : 'imágenes'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <section aria-labelledby="lista-evidencias" className="space-y-3">
        <h3 id="lista-evidencias" className="font-serif text-2xl font-semibold text-[var(--text)]">
          {memberMode ? 'Mis imágenes' : 'Evidencias'} ({rows.length})
        </h3>
        {rows.length === 0 && <Notice>Aún no hay evidencias.</Notice>}

        {editing && (
          <Card className="space-y-4 border-gold/40">
            <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Editar evidencia</h4>
            <img src={publicUrl('evidences', editing.row.thumb_path ?? editing.row.image_path)} alt={editing.row.title} className="h-32 rounded-xl object-cover" />
            <FieldsEditor value={editing.fields} onChange={(fields) => setEditing({ ...editing, fields })} phases={phases} members={members} errors={errors.edit} />
            <div className="flex flex-wrap items-center gap-3">
              <Toggle checked={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} />
              <Button loading={busy} onClick={saveEdit}>
                Guardar cambios
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {(() => {
          const item = (r: Row) => {
            const author = authorOf(r)
            return (
              <div className="flex flex-wrap items-center gap-3">
                <img src={publicUrl('evidences', r.thumb_path ?? r.image_path)} alt={r.title} width={80} height={56} loading="lazy" className="h-14 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--text)]">{r.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {CATEGORY_LABEL[r.category]} · {r.phase_id ? `Fase ${r.phase_id}` : 'Sin fase'} ·{' '}
                    <span className={r.published ? 'text-emerald-500' : 'text-[#f5b942]'}>{r.published ? 'Publicado' : 'Borrador'}</span>
                    {!memberMode && author && ` · enviada por ${plain(author.name)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!memberMode && <Toggle checked={r.published} onChange={(v) => togglePublished(r, v)} disabled={busy} />}
                  {!memberMode && (
                    <Button
                      variant="secondary"
                      aria-label={`Editar ${r.title}`}
                      onClick={() =>
                        setEditing({
                          row: r,
                          published: r.published,
                          fields: { title: r.title, description: r.description, category: r.category, phase_id: r.phase_id ? String(r.phase_id) : '', member_ids: r.member_ids ?? [], taken_on: r.taken_on ?? '' },
                        })
                      }
                    >
                      <Pencil size={15} aria-hidden /> Editar
                    </Button>
                  )}
                  {canDelete(r) && (
                    <Button variant="danger" disabled={busy} onClick={() => remove(r)} aria-label={`Eliminar ${r.title}`}>
                      <Trash2 size={15} aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            )
          }
          return memberMode ? (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  {item(r)}
                </li>
              ))}
            </ul>
          ) : (
            <SortableList
              items={rows}
              nameOf={(r) => r.title}
              onReorder={(ids) =>
                run('Orden guardado.', async () => {
                  await persistOrder('evidences', ids)
                  await refresh('evidences')
                })
              }
              render={item}
            />
          )
        })()}
      </section>
    </div>
  )
}
