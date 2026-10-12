import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Cabecera con acciones adicionales (descargar, etc.). */
  actions?: ReactNode
}

/** Modal a pantalla completa: foco atrapado, Esc para cerrar, scroll del fondo bloqueado. */
export function Modal({ open, onClose, title, children, actions }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[90] flex flex-col bg-[var(--viewer-bg)] text-[var(--viewer-text)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--viewer-line)] px-4 py-3">
            <h2 className="min-w-0 flex-1 truncate font-serif text-lg font-semibold text-gold">{title}</h2>
            {actions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--viewer-hover)]"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
