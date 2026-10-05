import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { z } from '../../../lib/zod'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { useConfirm } from '../../../components/ui/Confirm'
import { buildApa, compareApa, parseApa, REF_KIND_LABEL, type RefKind } from '../../../lib/apa'
import { deleteRow, insertRow, updateRow, useAction, useAdminRows, useRefresh } from '../adminData'
import type { BibliographyRef } from '../../../types'

type Row = BibliographyRef & { published: boolean }

const KIND_OPTIONS = (Object.keys(REF_KIND_LABEL) as RefKind[]).map((k) => ({ value: k, label: REF_KIND_LABEL[k] }))
const SOURCE_LABEL: Record<RefKind, string> = {
  libro: 'Editorial',
  articulo: 'Revista',
  web: 'Sitio web',
  imagen: 'Fuente o museo',
  video: 'Plataforma',
  recurso: 'Sitio web o institución',
  herramienta: 'Sitio web o empresa',
}
const DETAIL_LABEL: Record<RefKind, string> = {
  libro: 'Edición (opcional, ej. «2.ª ed.»)',
  articulo: 'Volumen(número), páginas (ej. «12(3), 45-67»)',
  web: 'Detalle (opcional)',
  imagen: 'Tipo (ej. «Fotografía», «Ilustración»)',
  video: 'Tipo (ej. «Video», «Entrevista»)',
  recurso: 'Tipo (ej. «Recurso educativo»)',
  herramienta: 'Tipo (ej. «Software»)',
}

const urlSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'La URL debe empezar por http:// o https://')

function Rendered({ text }: { text: string }) {
  return (
    <>
      {parseApa(text).map((t, i) => (t.type === 'em' ? <em key={i}>{t.value}</em> : <span key={i}>{t.value}</span>))}
    </>
  )
}

function RefForm({ initial, nextPosition, onClose }: { initial: Row | null; nextPosition: number; onClose: () => void }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [mode, setMode] = useState<'guiada' | 'manual'>(initial ? 'manual' : 'guiada')
  const [kind, setKind] = useState<RefKind>(initial?.kind ?? 'libro')
  const [authors, setAuthors] = useState(initial?.authors ?? '')
  const [year, setYear] = useState(initial?.year ?? '')
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [detail, setDetail] = useState('')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [manual, setManual] = useState(initial?.apa_text ?? '')
  const [published, setPublished] = useState(initial?.published ?? true)
  const [errors, setErrors] = useState<{ apa?: string; url?: string }>({})

  const built = useMemo(() => buildApa({ kind, authors, year, title, source, detail, url }), [kind, authors, year, title, source, detail, url])
  const apa = mode === 'guiada' ? built : manual

  const save = async () => {
    const e: typeof errors = {}
    if (apa.trim().length < 10) e.apa = mode === 'guiada' ? 'Completa al menos el título para armar la referencia.' : 'Escribe la referencia completa.'
    const u = urlSchema.safeParse(url)
    if (!u.success) e.url = u.error.issues[0].message
    setErrors(e)
    if (Object.keys(e).length) return
    const payload = {
      apa_text: apa.trim(),
      kind,
      url: url.trim() || null,
      authors: authors.trim() || null,
      year: year.trim() || null,
      published,
    }
    const ok = await run(initial ? 'Referencia actualizada.' : 'Referencia agregada.', async () => {
      if (initial) await updateRow('bibliography_refs', initial.id, payload)
      else await insertRow('bibliography_refs', { ...payload, position: nextPosition })
      await refresh('bibliography_refs')
      return true
    })
    if (ok) onClose()
  }

  return (
    <Card className="space-y-4 border-gold/40">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">{initial ? 'Editar referencia' : 'Agregar referencia'}</h3>

      <div role="group" aria-label="Cómo quieres crearla" className="flex flex-wrap gap-2">
        {(['guiada', 'manual'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm ${mode === m ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]' : 'border-[var(--border)] text-[var(--text)]'}`}
          >
            {m === 'guiada' ? 'Formulario guiado' : 'Pegar ya hecha'}
          </button>
        ))}
      </div>

      <SelectField label="Tipo de fuente" value={kind} onChange={(v) => setKind(v as RefKind)} options={KIND_OPTIONS} />

      {mode === 'guiada' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Autor(es)" value={authors} onChange={setAuthors} hint="Formato APA: «Apellido, N., & Apellido, M.»" />
          <TextField label="Año" value={year} onChange={setYear} hint="«2021», «2021, 5 de mayo» o vacío (s. f.)" />
          <div className="sm:col-span-2">
            <TextField label="Título" value={title} onChange={setTitle} required />
          </div>
          <TextField label={SOURCE_LABEL[kind]} value={source} onChange={setSource} />
          <TextField label={DETAIL_LABEL[kind]} value={detail} onChange={setDetail} />
        </div>
      ) : (
        <TextArea label="Referencia completa en APA 7" value={manual} onChange={setManual} rows={4} hint="Para poner cursiva escribe el título entre asteriscos: *Título*." />
      )}

      <TextField label="URL (opcional)" type="url" value={url} onChange={setUrl} error={errors.url} />
      {mode === 'manual' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Autor(es) (para buscar)" value={authors} onChange={setAuthors} />
          <TextField label="Año (para buscar)" value={year} onChange={setYear} />
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium text-[var(--text)]">Así se verá (APA 7, con sangría francesa)</p>
        <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 pl-12 -indent-8 leading-relaxed text-[var(--text)]" aria-live="polite">
          {apa.trim() ? <Rendered text={apa} /> : <span className="text-[var(--text-muted)]">Completa el formulario para ver la referencia.</span>}
        </p>
        {errors.apa && <p role="alert" className="mt-1 text-sm text-red-500">{errors.apa}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Toggle checked={published} onChange={setPublished} />
        <Button loading={busy} onClick={save}>
          {initial ? 'Guardar cambios' : 'Agregar referencia'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}

export default function ReferencesTab() {
  const { data: rows = [], isLoading } = useAdminRows<Row>('bibliography_refs', [['created_at', true]])
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const sorted = useMemo(() => [...rows].sort((a, b) => compareApa(a.apa_text, b.apa_text)), [rows])

  const remove = async (r: Row) => {
    const ok = await confirm({
      title: '¿Eliminar esta referencia?',
      message: 'Se quitará de la lista de referencias bibliográficas. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar referencia',
      danger: true,
    })
    if (!ok) return
    await run('Referencia eliminada.', async () => {
      await deleteRow('bibliography_refs', r.id)
      await refresh('bibliography_refs')
    })
  }

  return (
    <div className="space-y-5">
      <TabIntro title="Referencias bibliográficas">Se muestran en formato APA 7.ª edición y en orden alfabético automático. Usa el formulario guiado o pega la referencia ya hecha.</TabIntro>

      {editing === null && (
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Agregar referencia
        </Button>
      )}
      {editing !== null && <RefForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} nextPosition={rows.length + 1} onClose={() => setEditing(null)} />}

      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}
      {!isLoading && rows.length === 0 && <Notice>Aún no hay referencias.</Notice>}

      <ul className="space-y-3">
        {sorted.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="min-w-0 flex-1">
              <p className="break-words pl-8 leading-relaxed text-[var(--text)] -indent-8">
                <Rendered text={r.apa_text} />
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {REF_KIND_LABEL[r.kind as RefKind] ?? r.kind} · <span className={r.published ? 'text-emerald-500' : 'text-[#f5b942]'}>{r.published ? 'Publicada' : 'Borrador'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(r)} aria-label="Editar esta referencia">
                <Pencil size={15} aria-hidden /> Editar
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => remove(r)} aria-label="Eliminar esta referencia">
                <Trash2 size={15} aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
