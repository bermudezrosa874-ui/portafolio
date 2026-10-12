import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'

interface Props {
  url: string
  onError: () => void
}

export default function DocxViewer({ url, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    const body = bodyRef.current
    if (!host || !body) return
    let cancelled = false

    // Ajusta el ancho de la página de Word al de la pantalla (útil en celular).
    const fit = () => {
      const wrapper = body.querySelector<HTMLElement>('.docx-wrapper')
      if (!wrapper) return
      // El ancho se calcula desde las páginas: scrollWidth no cuenta el desborde del lado izquierdo
      // cuando el contenido está centrado.
      const pageW = Math.max(0, ...Array.from(wrapper.querySelectorAll<HTMLElement>('section.docx'), (s) => s.offsetWidth))
      const cs = getComputedStyle(wrapper)
      const contentW = pageW + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      wrapper.style.transform = ''
      wrapper.style.transformOrigin = 'top left'
      wrapper.style.width = `${contentW}px`
      const scale = Math.min(1, (host.clientWidth - 16) / contentW)
      wrapper.style.transform = `scale(${scale})`
      body.style.height = `${wrapper.offsetHeight * scale}px`
      body.style.width = `${contentW * scale}px`
    }

    ;(async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('descarga')
      const blob = await res.blob()
      if (cancelled) return
      body.replaceChildren()
      await renderAsync(blob, body, undefined, {
        className: 'docx',
        inWrapper: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
      })
      if (cancelled) return
      fit()
      setLoading(false)
    })().catch(() => !cancelled && onError())

    const ro = new ResizeObserver(fit)
    ro.observe(host)
    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [url, onError])

  return (
    <div ref={hostRef} className="h-full overflow-auto bg-[var(--viewer-panel)] p-2" tabIndex={0} aria-label="Documento de Word">
      {loading && <p className="p-8 text-center text-[var(--viewer-muted)]">Cargando documento…</p>}
      <div ref={bodyRef} className="mx-auto" />
    </div>
  )
}
