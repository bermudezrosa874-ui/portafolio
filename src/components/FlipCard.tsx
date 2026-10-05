import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface Props {
  front: ReactNode
  back: ReactNode
  flipped: boolean
  onToggle: () => void
  className?: string
  accent?: string
}

/** Tarjeta que se voltea (rotateY). El nombre accesible es el de la cara visible. */
export function FlipCard({ front, back, flipped, onToggle, className = 'h-64', accent }: Props) {
  const reduce = useReducedMotion()
  const face =
    'absolute inset-0 block rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg [backface-visibility:hidden]'

  return (
    <div className={className} style={{ perspective: 1200 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={flipped}
        className="relative block h-full w-full rounded-2xl text-left transition-transform hover:-translate-y-1 active:scale-[0.98]"
      >
        <motion.span
          className="absolute inset-0 block"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span aria-hidden={flipped} className={`${face} overflow-hidden`} style={{ borderTop: `3px solid ${accent ?? 'var(--c-gold)'}` }}>
            {front}
          </span>
          <span
            aria-hidden={!flipped}
            className={`${face} overflow-y-auto`}
            style={{ transform: 'rotateY(180deg)', borderTop: `3px solid ${accent ?? 'var(--c-gold)'}` }}
          >
            {back}
          </span>
        </motion.span>
        <span className="sr-only">{flipped ? 'Toca para volver al frente' : 'Toca para voltear la tarjeta'}</span>
      </button>
    </div>
  )
}
