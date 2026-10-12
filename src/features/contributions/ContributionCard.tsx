import { useRef } from 'react'
import { Eye, EyeOff, FileUp, Pencil, Send, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/forms'
import { useConfirm } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { friendlyError, useAction } from '../admin/adminData'
import { deleteContribution, fileUrl, replaceContributionFile, reviewContribution, updateContribution, useRefreshContributions } from './api'
import {
  CATEGORY_LABEL,
  KindIcon,
  KIND_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  fmtDate,
  fmtSize,
  fmtTime,
  validateContributionFile,
  type Contribution,
} from './model'

export function StatusBadge({ status }: { status: Contribution['status'] }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
}

interface Props {
  c: Contribution
  /** Administradora: ve y gestiona todo. Colaborador: solo se le muestran aportes propios. */
  isAdmin: boolean
  showUploader?: boolean
  onEdit: (c: Contribution) => void
}

/** Tarjeta de un aporte con sus acciones. Las acciones ajenas las rechaza el servidor aunque se fuerce la petición. */
export function ContributionCard({ c, isAdmin, showUploader, onEdit }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const refresh = useRefreshContributions()
  const { busy, run } = useAction()
  const input = useRef<HTMLInputElement>(null)
  const href = fileUrl(c)

  const setStatus = (status: Contribution['status'], ok: string) =>
    run(ok, async () => {
      await updateContribution(c.id, { status })
      await refresh()
    })

  const replace = async (file: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!file) return
    const check = await validateContributionFile(file)
    if (!check.ok) return toast('error', check.error)
    await run('Archivo reemplazado.', async () => {
      await replaceContributionFile(c, file, check)
      await refresh()
      if (!isAdmin) {
        const r = await reviewContribution(c.id)
        await refresh()
        toast(r.status === 'published' ? 'ok' : 'info', r.status === 'published' ? 'El archivo nuevo ya está publicado.' : `Aún no se publicó: ${r.note ?? 'Rosa lo revisará.'}`)
      }
    })
  }

  const remove = async () => {
    const yes = await confirm({
      title: 'Eliminar aporte',
      message: `«${c.title}» se eliminará de forma definitiva${c.file_path ? ', junto con su archivo' : ''}.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!yes) return
    try {
      await deleteContribution(c)
      await refresh()
      toast('ok', 'Aporte eliminado.')
    } catch (e) {
      toast('error', friendlyError(e))
    }
  }

  return (
    <li className="lift space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-lg hover:shadow-violet-500/10">
      <div className="flex flex-wrap items-start gap-3">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400/30 to-pink-400/30 text-2xl">
          <KindIcon kind={c.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-[var(--text)]">{c.title}</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {KIND_LABEL[c.kind]} · {CATEGORY_LABEL[c.category]}
            {c.file_path && ` · ${fmtSize(c.size_bytes)}`}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {showUploader && (
        <p className="text-sm text-[var(--text)]">
          <span className="text-[var(--text-muted)]">Subido por: </span>
          <strong>{c.uploaded_by_name || 'Sin nombre'}</strong>
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        Subido: {fmtDate(c.created_at)} · {fmtTime(c.created_at)}
      </p>
      {c.description && <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{c.description}</p>}
      {c.status === 'pending_review' && c.review_note && (
        <p className="rounded-lg bg-pink-400/15 px-3 py-2 text-xs text-[var(--text)]">Revisión automática: {c.review_note}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm text-[var(--text)] hover:bg-[var(--hover)]">
            <Eye size={15} aria-hidden /> Ver
          </a>
        )}
        <Button variant="secondary" disabled={busy} onClick={() => onEdit(c)}>
          <Pencil size={15} aria-hidden /> Editar
        </Button>
        {c.file_path && (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
              <FileUp size={15} aria-hidden /> Reemplazar
            </Button>
            <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-label={`Nuevo archivo para ${c.title}`} onChange={(e) => void replace(e.target.files?.[0])} />
          </>
        )}
        {isAdmin && c.status !== 'published' && (
          <Button disabled={busy} onClick={() => void setStatus('published', 'Publicado en el portafolio.')}>
            <Send size={15} aria-hidden /> Publicar
          </Button>
        )}
        {isAdmin && c.status === 'published' && (
          <Button variant="secondary" disabled={busy} onClick={() => void setStatus('hidden', 'Aporte oculto.')}>
            <EyeOff size={15} aria-hidden /> Ocultar
          </Button>
        )}
        <Button variant="danger" disabled={busy} onClick={() => void remove()}>
          <Trash2 size={15} aria-hidden /> Eliminar
        </Button>
      </div>
    </li>
  )
}
