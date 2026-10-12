import { useEffect, useRef } from 'react'
import { motion, type PanInfo } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, Tag, Users, X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { publicUrl } from '../../lib/upload'
import type { Evidence, EvidenceCategory, Member, Phase } from '../../types'
import { formatDate } from '../learning/parts'

export const CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  capturas: 'Capturas de actividades',
  conversaciones: 'Conversaciones del grupo',
  foro: 'Aportes en el foro',
  grabaciones: 'Grabaciones',
  bocetos: 'Bocetos',
  investigacion: 'Investigación',
  diseno: 'Diseño de recursos',
  otros: 'Otros',
}

interface Props {
  items: Evidence[]
  index: number
  /** Id de la miniatura tocada: solo esa imagen hace la transición de zoom. */
  openedId: string
  members: Member[]
  phases: Phase[]
  onIndex: (i: number) => void
  onClose: () => void
}

export function Lightbox({ items, index, openedId, members, phases, onIndex, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true)
  const item = items[index]
  const total = items.length

  const go = (delta: number) => onIndex((index + delta + total) % total)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % total)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + total) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total, onClose, onIndex])

  // Precarga de las imágenes vecinas
  useEffect(() => {
    for (const d of [-1, 1]) {
      const n = items[(index + d + total) % total]
      if (n) new Image().src = publicUrl('evidences', n.image_path)
    }
  }, [index, items, total])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (total < 2) return
    if (info.offset.x < -70 || info.velocity.x < -500) go(1)
    else if (info.offset.x > 70 || info.velocity.x > 500) go(-1)
  }

  if (!item) return null
  const phase = phases.find((p) => p.id === item.phase_id)
  const names = item.member_ids.map((id) => members.find((m) => m.id === id)?.name).filter(Boolean) as string[]
  const date = formatDate(item.taken_on)
  const navBtn =
    'absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/80'

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ${index + 1} de ${total}: ${item.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] flex flex-col bg-[var(--viewer-overlay)] text-[var(--viewer-text)]"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm tabular-nums text-[var(--viewer-muted)]" aria-live="polite">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor"
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--viewer-hover)]"
        >
          <X size={24} aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <motion.div
          drag={total > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.35}
          onDragEnd={onDragEnd}
          className="flex h-full w-full touch-pan-y items-center justify-center px-2 sm:px-16"
        >
          <motion.img
            key={item.id}
            layoutId={item.id === openedId ? `ev-${item.id}` : undefined}
            src={publicUrl('evidences', item.image_path)}
            alt={item.title}
            draggable={false}
            initial={item.id === openedId ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-full max-w-full select-none rounded-lg object-contain"
          />
        </motion.div>
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className={`${navBtn} left-2 sm:left-4`}>
              <ChevronLeft size={26} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className={`${navBtn} right-2 sm:right-4`}>
              <ChevronRight size={26} aria-hidden />
            </button>
          </>
        )}
      </div>

      <div className="max-h-[38vh] overflow-y-auto border-t border-[var(--viewer-line)] bg-[var(--viewer-panel)] px-5 py-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-gold">{item.title}</h2>
          <p className="mt-1.5 leading-relaxed text-[var(--viewer-text)]">{item.description}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--viewer-muted)]">
            {phase && (
              <li className="inline-flex items-center gap-1.5">
                <Tag size={14} aria-hidden className="text-teal" /> Fase {phase.id}: {phase.title}
              </li>
            )}
            {names.length > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <Users size={14} aria-hidden className="text-teal" /> {names.join(', ')}
              </li>
            )}
            {date && (
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden className="text-teal" /> {date}
              </li>
            )}
            <li className="text-[var(--viewer-muted)]">{CATEGORY_LABEL[item.category]}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
