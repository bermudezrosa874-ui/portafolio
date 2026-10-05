import { createElement, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/** Ícono + / −: la barra vertical se aplana al abrir. */
export function PlusMinus({ open, color }: { open: boolean; color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0" style={{ color }}>
      <motion.g animate={{ rotate: open ? 180 : 0 }} style={{ originX: '11px', originY: '11px' }}>
        <line x1="4" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <motion.line
          x1="11"
          y1="4"
          x2="11"
          y2="18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.g>
    </svg>
  )
}

interface Props {
  id: string
  open: boolean
  onToggle: () => void
  header: ReactNode
  children: ReactNode
  headingLevel?: 2 | 3 | 4
  accent?: string
  className?: string
  buttonClassName?: string
}

export function AccordionItem({
  id,
  open,
  onToggle,
  header,
  children,
  headingLevel = 3,
  accent,
  className = '',
  buttonClassName = '',
}: Props) {
  const reduce = useReducedMotion()
  const button = (
    <button
      type="button"
      id={`${id}-boton`}
      aria-expanded={open}
      aria-controls={`${id}-panel`}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-4 text-left ${buttonClassName}`}
    >
      <span className="min-w-0 flex-1">{header}</span>
      <PlusMinus open={open} color={accent} />
    </button>
  )

  return (
    <div className={className}>
      {createElement(`h${headingLevel}`, { className: 'm-0 text-base font-normal' }, button)}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-boton`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
