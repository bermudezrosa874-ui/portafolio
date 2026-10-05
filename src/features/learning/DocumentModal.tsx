import { lazy, Suspense, useCallback, useState } from 'react'
import { Download, FileWarning } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { DOCX_MIME } from '../../lib/fileValidation'
import { publicUrl } from '../../lib/upload'
import type { Deliverable } from '../../types'

const PdfViewer = lazy(() => import('./PdfViewer'))
const DocxViewer = lazy(() => import('./DocxViewer'))

interface Props {
  deliverable: Deliverable
  open: boolean
  onClose: () => void
}

export default function DocumentModal({ deliverable, open, onClose }: Props) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])

  const viewUrl = publicUrl('deliverables', deliverable.file_path)
  const downloadUrl = publicUrl('deliverables', deliverable.file_path, deliverable.file_name)
  const isDocx = deliverable.mime_type === DOCX_MIME

  const downloadLink = (
    <a
      href={downloadUrl}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
    >
      <Download size={16} aria-hidden /> <span className="hidden sm:inline">Descargar</span>
    </a>
  )

  return (
    <Modal open={open} onClose={onClose} title={deliverable.file_name} actions={downloadLink}>
      {failed ? (
        <div className="grid h-full place-items-center px-6 text-center">
          <div className="max-w-sm">
            <FileWarning className="mx-auto text-[#f5b942]" size={44} aria-hidden />
            <p className="mt-4 font-serif text-2xl text-[#f5b942]">No pudimos mostrar este documento</p>
            <p className="mt-2 text-slate-300">
              Puede que el archivo esté dañado o que tu navegador no lo permita. Puedes descargarlo y abrirlo en tu
              equipo.
            </p>
            <a
              href={downloadUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-6 py-3 font-semibold text-[#071426]"
            >
              <Download size={18} aria-hidden /> Descargar documento
            </a>
          </div>
        </div>
      ) : (
        <Suspense fallback={<p className="p-8 text-center text-slate-300">Cargando visor…</p>}>
          {isDocx ? <DocxViewer url={viewUrl} onError={onError} /> : <PdfViewer url={viewUrl} onError={onError} />}
        </Suspense>
      )}
    </Modal>
  )
}
