import { useState } from 'react'
import { BookOpen, Compass, Wrench, type LucideIcon } from 'lucide-react'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { firstName, initialsOf, inkOf, memberColor, readableOn, tintOf } from '../../lib/members'
import { useGroupEntries, useMembers, useSiteConfig } from '../../lib/queries'
import type { GroupCard, Member } from '../../types'

const TEXT_FALLBACK =
  'La construcción de este portafolio permitió integrar diferentes formas de representar el conocimiento. El desarrollo de líneas de tiempo, entrevistas, recursos interactivos y materiales audiovisuales fortaleció no solamente la comprensión de los contenidos académicos, sino también competencias relacionadas con investigación, comunicación, creatividad, trabajo colaborativo y uso de herramientas digitales.'

export const GROUP_CARD_META: { id: GroupCard; title: string; hint: string; icon: LucideIcon; color: string }[] = [
  { id: 'conocimiento', title: 'Conocimiento', hint: 'Qué aprendimos sobre la temática', icon: BookOpen, color: '#06B6D4' },
  { id: 'habilidades', title: 'Habilidades', hint: 'Qué aprendimos a hacer', icon: Wrench, color: '#7C3AED' },
  { id: 'experiencia', title: 'Experiencia', hint: 'Qué nos dejó el proceso', icon: Compass, color: '#F5B942' },
]

const PREVIEW = 2

/** Autoría de una cita: iniciales sobre el color de la persona y su primer nombre. */
export function Byline({ member }: { member: Member }) {
  const color = memberColor(member)
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
      <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold" style={{ background: color, color: readableOn(color) }}>
        {initialsOf(member.name)}
      </span>
      <span style={{ color: inkOf(color) }}>{firstName(member.name)}</span>
    </span>
  )
}

export function GroupReflection() {
  const { data: cfg } = useSiteConfig()
  const { data: members = [] } = useMembers()
  const { data: entries = [] } = useGroupEntries()
  const [expanded, setExpanded] = useState<Partial<Record<GroupCard, boolean>>>({})

  // Mientras nadie haya aportado, la reflexión grupal no se muestra a los visitantes.
  if (entries.length === 0) return null

  const byId = new Map(members.map((m) => [m.id, m]))
  const contributors = new Set(entries.filter((e) => byId.has(e.member_id)).map((e) => e.member_id)).size

  return (
    <section
      id="reflexion"
      aria-labelledby="reflexion-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="reflexion-titulo"
          kicker="Reflexión grupal"
          title="Lo que aprendimos"
          intro={cfg?.group_reflection || TEXT_FALLBACK}
        />
        <p className="-mt-6 mb-8 text-center text-sm font-medium text-gold" role="status">
          {contributors} de {members.length} integrantes {contributors === 1 ? 'ha aportado' : 'han aportado'}
        </p>

        <div className="grid items-start gap-5 md:grid-cols-3">
          {GROUP_CARD_META.map(({ id, title, hint, icon: Icon, color }, i) => {
            const list = entries.filter((e) => e.card === id && byId.has(e.member_id))
            const all = !!expanded[id]
            const shown = all ? list : list.slice(0, PREVIEW)
            return (
              <Reveal key={id} delay={i * 0.1}>
                <article
                  className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur transition-transform hover:-translate-y-1"
                  style={{ borderTop: `3px solid ${color}` }}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                    <Icon size={24} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-[var(--text)]">{title}</h3>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{hint}</p>

                  {list.length === 0 ? (
                    <p className="mt-4 text-sm italic text-[var(--text-muted)]">Aún no hay aportes en esta tarjeta.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {shown.map((e) => {
                        const m = byId.get(e.member_id)!
                        const c = memberColor(m)
                        return (
                          <li key={e.id} className="rounded-xl p-3" style={{ background: tintOf(c, 10), borderLeft: `3px solid ${c}` }}>
                            <blockquote className="whitespace-pre-line text-sm leading-relaxed text-[var(--text)]">{e.content}</blockquote>
                            <p className="mt-2">
                              <Byline member={m} />
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {list.length > PREVIEW && (
                    <button
                      type="button"
                      aria-expanded={all}
                      onClick={() => setExpanded((x) => ({ ...x, [id]: !all }))}
                      className="mt-4 min-h-10 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--hover)]"
                    >
                      {all ? 'Ver menos' : `Ver todos (${list.length})`}
                    </button>
                  )}
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
