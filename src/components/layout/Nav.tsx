import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { SECTIONS, scrollToSection } from '../../lib/sections'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import type { Theme } from '../../hooks/useTheme'
import { ProgressBar } from './ProgressBar'

interface Props {
  active: string
  theme: Theme
  onToggleTheme: () => void
}

export function Nav({ active, theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useFocusTrap(menuRef, open)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => scrollToSection(id), 60)
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-abyss/70 backdrop-blur-md [html[data-theme=light]_&]:bg-[#f6efdd]/80">
      <nav aria-label="Principal" className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#inicio"
          onClick={(e) => go(e, 'inicio')}
          aria-label="Ábaco del Tiempo, ir al inicio"
          className="flex items-center gap-2 font-serif text-xl font-semibold text-gold"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-[#f5b942] text-base text-abyss">
            π
          </span>
          <span className="hidden sm:inline">Ábaco del Tiempo</span>
        </a>

        <ul className="hidden items-center gap-1 xl:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => go(e, s.id)}
                aria-current={active === s.id ? 'location' : undefined}
                className={`relative rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  active === s.id ? 'text-gold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {s.label}
                {active === s.id && (
                  <motion.span
                    layoutId="nav-subrayado"
                    className="absolute inset-x-2.5 -bottom-px h-0.5 rounded bg-gold"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="grid h-10 w-10 place-items-center rounded-full text-[var(--text-muted)] hover:text-gold"
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="grid h-10 w-10 place-items-center rounded-full text-[var(--text)] xl:hidden"
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </nav>
      <ProgressBar />
    </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de secciones"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-abyss px-8 pb-10 pt-28 [html[data-theme=light]_&]:bg-[#f6efdd]"
          >
            <ul className="mx-auto flex max-w-sm flex-col gap-1">
              {SECTIONS.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i + 0.1 }}
                >
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => go(e, s.id)}
                    aria-current={active === s.id ? 'location' : undefined}
                    className={`flex items-baseline gap-3 border-b border-[var(--border)] py-3 font-serif text-3xl ${
                      active === s.id ? 'text-gold' : 'text-[var(--text)]'
                    }`}
                  >
                    <span className="w-6 font-sans text-xs text-[var(--text-muted)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
