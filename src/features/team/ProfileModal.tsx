import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ExternalLink, Quote, X } from 'lucide-react'
import { SoonText } from '../../components/SoonText'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { activeAgo, inkOf, memberColor, plainName, shortDate, tintOf } from '../../lib/members'
import { ui } from '../../lib/uiStore'
import type { Phase } from '../../types'
import { Bar, MemberAvatar, SymbolBadge } from './MemberBits'
import { GROUP_CARDS, type MemberStats, type WorkItem } from './participation'

const TABS = [
  { id: 'sobre', label: 'Sobre mí' },
  { id: 'participacion', label: 'Su participación' },
  { id: 'trabajo', label: 'Su trabajo' },
] as const
type TabId = (typeof TABS)[number]['id']

const TYPE_LABEL: Record<string, [string, string]> = {
  aporte: ['aporte', 'aportes'],
  recurso: ['recurso', 'recursos'],
  entrevista: ['entrevista', 'entrevistas'],
  evidencia: ['evidencia', 'evidencias'],
  entrega: ['documento de fase', 'documentos de fase'],
}

const NONE = 'Aún no ha publicado'

/** Perfil completo de un integrante: quién es, cuánto ha participado y un poco de su trabajo. */
export function ProfileModal({ stats, phases, onClose }: { stats: MemberStats | null; phases: Phase[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<TabId>('sobre')
  const open = !!stats
  useFocusTrap(ref, open)

  useEffect(() => setTab('sobre'), [stats?.member.id])

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

  const openItem = (item: WorkItem) => {
    onClose()
    const phase = phases.find((p) => p.id === item.phaseId)
    if (item.type === 'entrega' && phase) ui.revealPhase(phase.id, phase.moment_id)
    else ui.goToSection(item.section, null)
  }

  return createPortal(
    <AnimatePresence>
      {stats && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-end bg-black/60 backdrop-blur-sm sm:place-items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <Panel stats={stats} tab={tab} setTab={setTab} onClose={onClose} openItem={openItem} panelRef={ref} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Panel({
  stats,
  tab,
  setTab,
  onClose,
  openItem,
  panelRef,
}: {
  stats: MemberStats
  tab: TabId
  setTab: (t: TabId) => void
  onClose: () => void
  openItem: (i: WorkItem) => void
  panelRef: RefObject<HTMLDivElement | null>
}) {
  const m = stats.member
  const color = memberColor(m)
  const name = plainName(m.name)
  const published = stats.items.length

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="perfil-nombre"
      initial={{ y: 40, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-2xl sm:rounded-3xl"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <header className="flex items-start gap-4 p-5 sm:p-6" style={{ background: `linear-gradient(135deg, ${tintOf(color, 20)}, transparent 70%)` }}>
        <MemberAvatar member={m} size={84} badge />
        <div className="min-w-0 flex-1">
          <h2 id="perfil-nombre" className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
            {name}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{m.topic}</p>
          <span className="mt-2 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: tintOf(color, 22), color: inkOf(color) }}>
            <SoonText value={m.role} />
          </span>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar perfil" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--hover)]">
          <X size={22} aria-hidden />
        </button>
      </header>

      <div role="tablist" aria-label="Secciones del perfil" className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-4 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className="shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors"
            style={{ borderColor: tab === t.id ? color : 'transparent', color: tab === t.id ? inkOf(color) : 'var(--text-muted)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {tab === 'sobre' && (
          <div className="space-y-5">
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Sobre mí</h3>
              <p className="mt-1 whitespace-pre-line leading-relaxed">{m.about || <span className="italic text-[var(--text-muted)]">Aún no ha escrito su presentación.</span>}</p>
            </section>
            {m.quote && (
              <blockquote className="flex gap-3 rounded-2xl p-4" style={{ background: tintOf(color, 12), borderLeft: `4px solid ${color}` }}>
                <Quote size={20} aria-hidden className="mt-0.5 shrink-0" style={{ color: inkOf(color) }} />
                <p className="font-serif text-lg italic leading-snug">{m.quote}</p>
              </blockquote>
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Símbolo favorito</dt>
                <dd className="mt-1">{m.symbol ? <SymbolBadge symbol={m.symbol} color={color} size={36} /> : <span className="text-sm italic text-[var(--text-muted)]">Aún no lo ha elegido</span>}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Rol</dt>
                <dd className="mt-1 text-sm">
                  <SoonText value={m.role} />
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Aporte principal al proyecto</dt>
                <dd className="mt-1 whitespace-pre-line leading-relaxed">
                  <SoonText value={m.contribution} />
                </dd>
              </div>
            </dl>
          </div>
        )}

        {tab === 'participacion' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Fases de bitácora completadas" value={stats.bitacoraDone} max={stats.bitacoraTotal} color={color} />
              <Metric label="Aportes a la reflexión grupal" value={stats.groupDone} max={stats.groupTotal} color={color} />
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Aportes, recursos y evidencias publicados</p>
              {published === 0 ? (
                <p className="mt-1 text-[var(--text-muted)]">{NONE}</p>
              ) : (
                <>
                  <p className="font-serif text-4xl font-semibold" style={{ color: inkOf(color) }}>
                    {published}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {(Object.keys(stats.counts) as (keyof typeof stats.counts)[])
                      .filter((k) => stats.counts[k] > 0)
                      .map((k) => `${stats.counts[k]} ${TYPE_LABEL[k][stats.counts[k] === 1 ? 0 : 1]}`)
                      .join(' · ')}
                  </p>
                </>
              )}
              <p className="mt-2 text-sm font-medium">{activeAgo(stats.lastActivity)}</p>
            </div>
            <section aria-labelledby="actividad-reciente">
              <h3 id="actividad-reciente" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Actividad reciente
              </h3>
              {stats.events.length === 0 ? (
                <p className="mt-2 text-[var(--text-muted)]">{NONE}</p>
              ) : (
                <ol className="mt-3 space-y-3 border-l-2 pl-4" style={{ borderColor: tintOf(color, 45) }}>
                  {stats.events.slice(0, 8).map((e) => (
                    <li key={e.key} className="relative">
                      <span aria-hidden className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <p className="text-sm">
                        {e.text} <span className="text-[var(--text-muted)]">· {shortDate(e.date)}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}

        {tab === 'trabajo' && (
          <div className="space-y-7">
            <section aria-labelledby="ultima-bitacora">
              <h3 id="ultima-bitacora" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Su última reflexión de bitácora
              </h3>
              {stats.lastReflection ? (
                <div className="mt-2 rounded-2xl p-4" style={{ background: tintOf(color, 10), borderLeft: `4px solid ${color}` }}>
                  <p className="text-xs font-semibold" style={{ color: inkOf(color) }}>
                    Fase {stats.lastReflection.phaseId}
                  </p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{stats.lastReflection.snippet}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      ui.openJournal(m.id)
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm hover:bg-[var(--hover)]"
                  >
                    <BookOpen size={15} aria-hidden /> Leer su bitácora
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-[var(--text-muted)]">{NONE}</p>
              )}
            </section>

            <section aria-labelledby="sus-aportes-grupales">
              <h3 id="sus-aportes-grupales" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Sus aportes a la reflexión grupal
              </h3>
              {stats.groupEntries.length === 0 ? (
                <p className="mt-2 text-[var(--text-muted)]">{NONE}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {GROUP_CARDS.flatMap((c) => stats.groupEntries.filter((g) => g.card === c.id)).map((g) => (
                    <li key={g.id} className="rounded-xl border border-[var(--border)] p-3">
                      <p className="text-xs font-semibold" style={{ color: inkOf(color) }}>
                        {GROUP_CARDS.find((c) => c.id === g.card)?.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed">{g.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="lo-que-subio">
              <h3 id="lo-que-subio" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Lo que ha subido
              </h3>
              {stats.items.length === 0 ? (
                <p className="mt-2 text-[var(--text-muted)]">{NONE}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {stats.items.map((i) => (
                    <li key={`${i.type}-${i.id}`} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{i.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {i.label}
                          {i.phaseId ? ` · Fase ${i.phaseId}` : ''} · {shortDate(i.date)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openItem(i)}
                        aria-label={`Abrir ${i.title} en el portafolio`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--hover)]"
                      >
                        <ExternalLink size={14} aria-hidden /> Abrir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Metric({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-4">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mb-2 font-serif text-3xl font-semibold tabular-nums" style={{ color: inkOf(color) }}>
        {value}/{max}
      </p>
      <Bar value={value} max={max} color={color} label={label} />
    </div>
  )
}
