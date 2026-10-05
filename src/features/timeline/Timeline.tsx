import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ExternalLink, GitBranch, X } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { Reveal } from '../../components/Reveal'
import { SafeFrame } from '../../components/SafeFrame'
import { SectionHeading } from '../../components/SectionHeading'
import { resolveEmbed } from '../../lib/embed'
import { useResources, useSiteConfig } from '../../lib/queries'

const TEXT_FALLBACK =
  'Este recurso presenta de manera cronológica los principales acontecimientos, personajes y aportes estudiados durante el desarrollo de la asignatura. Su organización permite comprender la evolución histórica de los conceptos y establecer relaciones entre los diferentes acontecimientos.'

export function Timeline() {
  const { data: cfg } = useSiteConfig()
  const { data: resources } = useResources()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  const timeline = resources?.find((r) => r.kind === 'timeline')
  const info = resolveEmbed(timeline?.url)
  const canEmbed = !!info.embedUrl

  const primary =
    'inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-7 py-3.5 text-base font-semibold text-[#071426] shadow-[0_8px_30px_-8px_rgba(245,185,66,0.7)] transition-transform active:scale-95'

  return (
    <section
      id="linea-de-tiempo"
      aria-labelledby="linea-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="linea-titulo"
          kicker="Cronología"
          title="Línea de tiempo"
          intro={cfg?.timeline_text || TEXT_FALLBACK}
        />

        {/* Motivo: eje cronológico decorativo */}
        <Reveal className="mb-10" y={10}>
          <svg viewBox="0 0 600 40" aria-hidden focusable="false" className="mx-auto w-full max-w-xl">
            <line x1="10" y1="20" x2="590" y2="20" stroke="var(--border)" strokeWidth="2" />
            {[40, 150, 260, 360, 470, 560].map((x, i) => (
              <circle key={x} cx={x} cy="20" r={i % 2 ? 5 : 8} fill={['#06B6D4', '#7C3AED', '#F5B942'][i % 3]} />
            ))}
          </svg>
        </Reveal>

        <div className="text-center">
          {!timeline && (
            <EmptyState icon={GitBranch} title="Aún no se ha publicado la línea de tiempo" text="Pronto estará disponible aquí." />
          )}

          {timeline && !info.valid && (
            <EmptyState icon={GitBranch} title="El enlace de la línea de tiempo no es válido" />
          )}

          {timeline && info.valid && canEmbed && (
            <button type="button" className={primary} aria-expanded={open} aria-controls="linea-visor" onClick={() => setOpen((o) => !o)}>
              <GitBranch size={20} aria-hidden /> {open ? 'Ocultar línea de tiempo' : 'Explorar línea de tiempo'}
            </button>
          )}

          {timeline && info.valid && !canEmbed && (
            <a href={info.openUrl!} target="_blank" rel="noopener noreferrer" className={primary}>
              <ExternalLink size={20} aria-hidden /> Explorar línea de tiempo
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && timeline && canEmbed && (
            <motion.div
              id="linea-visor"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
                  <p className="min-w-0 truncate font-serif text-lg font-semibold text-[var(--text)]">{timeline.title}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={info.openUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--border)]"
                    >
                      <ExternalLink size={15} aria-hidden /> <span className="hidden sm:inline">Abrir en pestaña nueva</span>
                      <span className="sr-only sm:hidden">Abrir en pestaña nueva</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Cerrar línea de tiempo"
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--border)]"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="h-[70vh] min-h-[420px] bg-white">
                  <SafeFrame src={info.embedUrl!} title={`Línea de tiempo: ${timeline.title}`} />
                </div>
                <p className="px-4 py-2 text-xs text-[var(--text-muted)]">
                  ¿No se ve bien? Ábrela en una pestaña nueva con el botón de arriba.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Reveal className="mt-12 rounded-2xl border-l-4 border-teal bg-[var(--surface)] p-6">
          <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">¿Qué aprendimos?</h3>
          <p className="mt-2 leading-relaxed text-[var(--text-muted)]">{cfg?.timeline_learned}</p>
        </Reveal>
      </div>
    </section>
  )
}
