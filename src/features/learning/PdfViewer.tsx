import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const ZOOMS = [0.6, 0.8, 1, 1.25, 1.5, 2, 3]

interface Props {
  url: string
  onError: () => void
}

export default function PdfViewer({ url, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [zoomIdx, setZoomIdx] = useState(2)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [loading, setLoading] = useState(true)

  // Carga del documento
  useEffect(() => {
    let cancelled = false
    const task = pdfjs.getDocument({ url })
    task.promise
      .then((d) => {
        if (cancelled) return
        setDoc(d)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return // cancelación propia (StrictMode o cierre del visor)
        console.error('No se pudo abrir el PDF:', e)
        onError()
      })
    return () => {
      cancelled = true
      void task.destroy()
    }
  }, [url, onError])

  // Ancho disponible (para ajustar la página a la pantalla, también en celular)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const update = () => setSize({ w: host.clientWidth, h: host.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  // Dibujo de la página actual
  useEffect(() => {
    const canvas = canvasRef.current
    if (!doc || !canvas || size.w === 0) return
    let renderTask: pdfjs.RenderTask | undefined
    let cancelled = false

    ;(async () => {
      const p = await doc.getPage(page)
      if (cancelled) return
      const base = p.getViewport({ scale: 1 })
      // 100 % = página completa a la vista (ajustada al ancho y al alto disponibles)
      const fit = Math.min(Math.max(size.w - 24, 200) / base.width, Math.max(size.h - 24, 200) / base.height)
      const cssScale = fit * ZOOMS[zoomIdx]
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = p.getViewport({ scale: cssScale * dpr })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
      renderTask = p.render({ canvas, viewport })
      await renderTask.promise
    })().catch((e: unknown) => {
      if ((e as { name?: string })?.name !== 'RenderingCancelledException') {
        console.error('No se pudo dibujar el PDF:', e)
        onError()
      }
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [doc, page, zoomIdx, size, onError])

  const pages = doc?.numPages ?? 0
  const go = useCallback((delta: number) => setPage((p) => Math.min(Math.max(p + delta, 1), Math.max(pages, 1))), [pages])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1)
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const btn =
    'grid h-10 w-10 place-items-center rounded-lg border border-white/15 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="flex h-full flex-col bg-[#1b2433]">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-b border-white/10 px-3 py-2 text-sm text-slate-200">
        <div className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => go(-1)} disabled={page <= 1} aria-label="Página anterior">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <span aria-live="polite" className="min-w-[8.5rem] text-center tabular-nums">
          Página {page} de {pages || '…'}
        </span>
        <button type="button" className={btn} onClick={() => go(1)} disabled={page >= pages} aria-label="Página siguiente">
          <ChevronRight size={20} aria-hidden />
        </button>
        </div>
        <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={btn}
          onClick={() => setZoomIdx((z) => Math.max(z - 1, 0))}
          disabled={zoomIdx === 0}
          aria-label="Alejar"
        >
          <ZoomOut size={20} aria-hidden />
        </button>
        <button
          type="button"
          className="min-h-10 min-w-14 rounded-lg px-1 tabular-nums hover:bg-white/10"
          onClick={() => setZoomIdx(2)}
          aria-label="Restablecer zoom"
        >
          {Math.round(ZOOMS[zoomIdx] * 100)} %
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => setZoomIdx((z) => Math.min(z + 1, ZOOMS.length - 1))}
          disabled={zoomIdx === ZOOMS.length - 1}
          aria-label="Acercar"
        >
          <ZoomIn size={20} aria-hidden />
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const el = hostRef.current?.parentElement
            if (document.fullscreenElement) void document.exitFullscreen()
            else void el?.requestFullscreen?.()
          }}
          aria-label="Pantalla completa"
        >
          <Maximize2 size={18} aria-hidden />
        </button>
        </div>
      </div>

      <div ref={hostRef} className="min-h-0 flex-1 overflow-auto p-3" tabIndex={0} aria-label="Documento PDF">
        {loading && <p className="p-8 text-center text-slate-300">Cargando documento…</p>}
        <canvas ref={canvasRef} className="mx-auto block bg-white shadow-xl" />
      </div>
    </div>
  )
}
