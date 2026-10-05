import { isAllowedHttpsUrl } from '../lib/embed'

interface Props {
  src: string
  title: string
  className?: string
}

/**
 * Único lugar donde se crean iframes de contenido externo.
 * Revalida la URL (https + lista blanca) y aplica sandbox y referrerpolicy.
 */
export function SafeFrame({ src, title, className = 'h-full w-full' }: Props) {
  if (!isAllowedHttpsUrl(src)) {
    return (
      <p role="alert" className="p-4 text-sm text-red-500">
        Este enlace no está permitido para mostrarse incrustado.
      </p>
    )
  }
  return (
    <iframe
      src={src}
      title={title}
      className={className}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation"
      allow="fullscreen; autoplay; encrypted-media; picture-in-picture; clipboard-write"
    />
  )
}
