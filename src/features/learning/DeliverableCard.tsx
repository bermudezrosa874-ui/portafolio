import { lazy, Suspense, useState } from 'react'
import { Download, Eye, FileText, FileType2, Inbox } from 'lucide-react'
import { DOCX_MIME } from '../../lib/fileValidation'
import { publicUrl } from '../../lib/upload'
import type { Deliverable } from '../../types'
import { formatDate, formatSize } from './parts'

const DocumentModal = lazy(() => import('./DocumentModal'))

export function DeliverableCard({ deliverable }: { deliverable: Deliverable | undefined }) {
  const [open, setOpen] = useState(false)

  if (!deliverable) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--border)] p-5 text-[var(--text-muted)]">
        <Inbox size={28} aria-hidden className="shrink-0 opacity-70" />
        <p>Aún no se ha subido la entrega de esta fase.</p>
      </div>
    )
  }

  const isDocx = deliverable.mime_type === DOCX_MIME
  const Icon = isDocx ? FileType2 : FileText
  const date = formatDate(deliverable.created_at)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal">
          <Icon size={24} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="break-words font-medium text-[var(--text)]">{deliverable.file_name}</p>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {isDocx ? 'Word (.docx)' : 'PDF'} · {formatSize(deliverable.size_bytes)}
            {date && ` · ${date}`}
          </p>
          {deliverable.uploaded_by_name && (
            <p className="text-sm text-[var(--text-muted)]">Subido por {deliverable.uploaded_by_name}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-2.5 text-sm font-semibold text-[#071426] transition-transform active:scale-95"
        >
          <Eye size={18} aria-hidden /> Ver documento
        </button>
        <a
          href={publicUrl('deliverables', deliverable.file_path, deliverable.file_name)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-transform hover:bg-[var(--hover)] active:scale-95"
        >
          <Download size={18} aria-hidden /> Descargar
        </a>
      </div>

      {open && (
        <Suspense fallback={null}>
          <DocumentModal deliverable={deliverable} open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
