import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BookMarked, Check, Copy, Search } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { SectionHeading } from '../../components/SectionHeading'
import { compareApa, parseApa, REF_KIND_LABEL, stripMarkers, type RefKind } from '../../lib/apa'
import { useReferences } from '../../lib/queries'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function References() {
  const { data: refs = [] } = useReferences()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<RefKind | 'todas'>('todas')
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const sorted = useMemo(() => [...refs].sort((a, b) => compareApa(a.apa_text, b.apa_text)), [refs])
  const kindsPresent = (Object.keys(REF_KIND_LABEL) as RefKind[]).filter((k) => refs.some((r) => r.kind === k))

  const visible = useMemo(() => {
    const q = norm(query.trim())
    return sorted.filter(
      (r) =>
        (kind === 'todas' || r.kind === kind) &&
        (!q || norm(`${stripMarkers(r.apa_text)} ${r.authors ?? ''} ${r.url ?? ''}`).includes(q)),
    )
  }, [sorted, kind, query])

  const copy = async (id: string, text: string) => {
    const ok = await copyText(stripMarkers(text))
    if (ok) {
      setCopied(id)
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000)
    }
  }

  const chip = (on: boolean) =>
    `min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors ${
      on
        ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]'
        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <section
      id="referencias"
      aria-labelledby="referencias-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          id="referencias-titulo"
          kicker="APA 7.ª edición"
          title="Referencias bibliográficas"
          intro="Las fuentes que sustentan este portafolio, en orden alfabético y con sangría francesa."
        />

        <div className="text-center">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="lista-referencias"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-7 py-3.5 text-base font-semibold text-[#071426] shadow-[0_8px_30px_-8px_rgba(245,185,66,0.7)] transition-transform active:scale-95"
          >
            <span aria-hidden>📚</span> {open ? 'Ocultar referencias' : 'Consultar referencias'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="lista-referencias"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-10">
                {refs.length === 0 ? (
                  <EmptyState icon={BookMarked} title="Aún no hay referencias publicadas" text="Las fuentes aparecerán aquí." />
                ) : (
                  <>
                    <div className="space-y-4">
                      <div role="search" className="relative mx-auto max-w-md">
                        <label htmlFor="buscar-ref" className="sr-only">
                          Buscar en las referencias
                        </label>
                        <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          id="buscar-ref"
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Buscar por autor, título o año…"
                          className="w-full rounded-full border border-[var(--border)] bg-[var(--card)] py-3 pl-11 pr-4 text-[var(--text)] outline-none focus:border-gold"
                        />
                      </div>
                      <div role="group" aria-label="Filtrar por tipo de fuente" className="flex flex-wrap justify-center gap-2">
                        <button type="button" aria-pressed={kind === 'todas'} className={chip(kind === 'todas')} onClick={() => setKind('todas')}>
                          Todas
                        </button>
                        {kindsPresent.map((k) => (
                          <button key={k} type="button" aria-pressed={kind === k} className={chip(kind === k)} onClick={() => setKind(kind === k ? 'todas' : k)}>
                            {REF_KIND_LABEL[k]}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-sm text-[var(--text-muted)]" aria-live="polite">
                        {visible.length} {visible.length === 1 ? 'referencia' : 'referencias'}
                      </p>
                    </div>

                    {visible.length === 0 ? (
                      <p className="mt-8 text-center text-[var(--text-muted)]">Ninguna referencia coincide con tu búsqueda.</p>
                    ) : (
                      <ol className="mt-8 space-y-5">
                        {visible.map((r) => (
                          <li key={r.id} className="flex items-start gap-3">
                            <p className="min-w-0 flex-1 break-words pl-8 leading-relaxed text-[var(--text)] -indent-8">
                              {parseApa(r.apa_text).map((t, i) =>
                                t.type === 'em' ? (
                                  <em key={i}>{t.value}</em>
                                ) : t.type === 'link' ? (
                                  <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="break-all text-teal underline underline-offset-2">
                                    {t.value}
                                  </a>
                                ) : (
                                  <span key={i}>{t.value}</span>
                                ),
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => copy(r.id, r.apa_text)}
                              aria-label={copied === r.id ? 'Referencia copiada' : 'Copiar referencia'}
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
                            >
                              {copied === r.id ? <Check size={17} aria-hidden className="text-emerald-500" /> : <Copy size={17} aria-hidden />}
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
