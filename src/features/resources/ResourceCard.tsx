import { motion } from 'motion/react'
import {
  ClipboardList,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  Network,
  Presentation,
  Shapes,
  type LucideIcon,
} from 'lucide-react'
import { useTilt } from '../../hooks/useTilt'
import type { EmbedInfo } from '../../lib/embed'
import { publicUrl } from '../../lib/upload'
import type { Resource, ResourceKind } from '../../types'

export const KIND_META: Record<Exclude<ResourceKind, 'timeline'>, { label: string; plural: string; icon: LucideIcon; cta: string }> = {
  infografia: { label: 'Infografía', plural: 'Infografías', icon: ImageIcon, cta: 'Explorar recurso' },
  presentacion: { label: 'Presentación', plural: 'Presentaciones', icon: Presentation, cta: 'Ver recurso' },
  actividad: { label: 'Actividad', plural: 'Actividades', icon: ClipboardList, cta: 'Comenzar actividad' },
  mapa_mental: { label: 'Mapa mental', plural: 'Mapas mentales', icon: Network, cta: 'Explorar recurso' },
  juego: { label: 'Juego', plural: 'Juegos', icon: Gamepad2, cta: 'Comenzar actividad' },
  otro: { label: 'Otro', plural: 'Otros', icon: Shapes, cta: 'Ver recurso' },
}

interface Props {
  resource: Resource
  number: number
  info: EmbedInfo
  phaseLabel: string | null
  onOpen: () => void
}

export function ResourceCard({ resource, number, info, phaseLabel, onOpen }: Props) {
  const tilt = useTilt(6)
  const kind = resource.kind === 'timeline' ? 'otro' : resource.kind
  const meta = KIND_META[kind]
  const Icon = meta.icon
  const embeddable = !!info.embedUrl

  const cta =
    'mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f5b942] px-5 py-2.5 text-sm font-semibold text-[#071426] transition-transform active:scale-95'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="list-none"
    >
      <motion.div
        style={tilt.style}
        {...tilt.handlers}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg backdrop-blur"
      >
        <div className="relative aspect-[16/10] bg-gradient-to-br from-violet/30 via-teal/20 to-gold/20">
          {resource.cover_path ? (
            <img
              src={publicUrl('covers', resource.cover_path)}
              alt={`Portada de ${resource.title}`}
              width={640}
              height={400}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Icon aria-hidden size={56} className="absolute inset-0 m-auto text-[var(--text)] opacity-50" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-abyss/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#f5b942] backdrop-blur">
            Recurso {String(number).padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[var(--text)]">
              <Icon size={13} aria-hidden /> {meta.label}
            </span>
            {phaseLabel && <span className="rounded-full bg-teal/15 px-2.5 py-0.5 font-medium text-teal">{phaseLabel}</span>}
          </div>
          <h3 className="font-serif text-2xl font-semibold leading-tight text-[var(--text)]">{resource.title}</h3>
          {resource.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">{resource.description}</p>
          )}

          {embeddable ? (
            <button type="button" onClick={onOpen} className={cta}>
              {meta.cta}
            </button>
          ) : info.valid ? (
            <a href={info.openUrl!} target="_blank" rel="noopener noreferrer" className={cta}>
              {meta.cta} <ExternalLink size={15} aria-hidden />
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          ) : (
            <p className="mt-auto text-sm text-[var(--text-muted)]">El enlace de este recurso no es válido.</p>
          )}
        </div>
      </motion.div>
    </motion.li>
  )
}
