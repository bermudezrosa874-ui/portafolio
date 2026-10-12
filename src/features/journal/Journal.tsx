import { useEffect, useMemo, useState } from 'react'
import { Compass, Lightbulb, Mountain, Pencil, Sparkles, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { FlipCard } from '../../components/FlipCard'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useRole } from '../../hooks/useAuth'
import { useLearningData, useMembers, useReflections } from '../../lib/queries'
import { useUi } from '../../lib/uiStore'
import type { Reflection } from '../../types'
import { REFLECTION_FIELDS, ReflectionEditor } from './ReflectionEditor'

export const META: Record<(typeof REFLECTION_FIELDS)[number]['key'], { icon: LucideIcon; color: string }> = {
  aprendi: { icon: Lightbulb, color: '#06B6D4' },
  dificulto: { icon: Mountain, color: '#7C3AED' },
  sorprendio: { icon: Sparkles, color: '#F5B942' },
  quisiera_aprender: { icon: Compass, color: '#2563EB' },
}

export const isComplete = (r: Reflection | undefined) =>
  !!r && [r.aprendi, r.dificulto, r.sorprendio, r.quisiera_aprender].every((t) => t.trim().length > 0)

const firstName = (name: string) => name.replace(/\[[^\]]*\]/g, '').trim().split(/\s+/)[0] || 'Integrante'

export function Journal() {
  const { data: members = [] } = useMembers()
  const { data: reflections = [] } = useReflections()
  const { data: learning } = useLearningData()
  const { phaseFilter } = useUi()
  const { session, isAdmin } = useRole()

  const phases = learning?.phases ?? []
  const phaseIds = phases.length ? phases.map((p) => p.id) : [1, 2, 3, 4, 5]

  const [memberId, setMemberId] = useState<string | null>(null)
  const [phaseId, setPhaseId] = useState(1)
  const [flips, setFlips] = useState([false, false, false, false])
  const [editing, setEditing] = useState(false)

  const member = members.find((m) => m.id === memberId) ?? members[0]
  const phase = phases.find((p) => p.id === phaseId)

  // Un acceso rápido desde una fase fija la fase de la bitácora.
  useEffect(() => {
    if (phaseFilter !== null) setPhaseId(phaseFilter)
  }, [phaseFilter])

  // Al cambiar de integrante o de fase se vuelve a mostrar el frente de las tarjetas.
  useEffect(() => {
    setFlips([false, false, false, false])
    setEditing(false)
  }, [member?.id, phaseId])

  const byKey = useMemo(() => {
    const map = new Map<string, Reflection>()
    for (const r of reflections) map.set(`${r.member_id}:${r.phase_id}`, r)
    return map
  }, [reflections])

  const completedFor = (mId: string) => phaseIds.filter((p) => isComplete(byKey.get(`${mId}:${p}`))).length

  const current = member ? byKey.get(`${member.id}:${phaseId}`) : undefined
  const myMember = session ? members.find((m) => m.user_id === session.user.id) : undefined
  const canEdit = !!member && !!session && (isAdmin || myMember?.id === member.id)
  const allFlipped = flips.every(Boolean)

  const memberName = member ? member.name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante' : ''

  return (
    <section
      id="bitacora"
      aria-labelledby="bitacora-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="bitacora-titulo"
          kicker="Reflexión individual por fase"
          title="Bitácora del equipo"
          intro="Cada integrante cuenta qué aprendió, qué se le dificultó, qué le sorprendió y qué le gustaría aprender. Elige a alguien y una fase, y voltea las tarjetas."
        />

        <Reveal>
          <div
            role="group"
            aria-label="Elegir integrante"
            className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5"
          >
            {members.map((m) => {
              const on = m.id === member?.id
              const done = completedFor(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMemberId(m.id)}
                  className={`flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all sm:w-auto sm:shrink ${
                    on
                      ? 'border-gold bg-gold/10 shadow-[0_0_0_1px_var(--c-gold)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:-translate-y-0.5'
                  }`}
                >
                  <Avatar name={m.name} photoPath={m.photo_path} size={56} />
                  <span className="font-serif text-lg font-semibold leading-tight text-[var(--text)]">{firstName(m.name)}</span>
                  <span className="rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs tabular-nums text-[var(--text)]">
                    {firstName(m.name)}: {done}/{phaseIds.length} fases completadas
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <div role="group" aria-label="Elegir fase" className="mt-6 flex flex-wrap justify-center gap-2">
          {phaseIds.map((id) => {
            const on = id === phaseId
            const done = member ? isComplete(byKey.get(`${member.id}:${id}`)) : false
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                title={phases.find((p) => p.id === id)?.title}
                onClick={() => setPhaseId(id)}
                className={`min-h-10 rounded-full border px-4 py-2 text-sm transition-colors ${
                  on
                    ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
                }`}
              >
                Fase {id}
                {done && <span className="sr-only"> (completa)</span>}
                {done && <span aria-hidden> ✓</span>}
              </button>
            )
          })}
        </div>

        {member && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">
                  {memberName} · Fase {phaseId}
                </h3>
                {phase && <p className="text-sm text-[var(--text-muted)]">{phase.title}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setFlips(allFlipped ? [false, false, false, false] : [true, true, true, true])}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)]"
                  >
                    {allFlipped ? 'Mostrar frentes' : 'Voltear todas'}
                  </button>
                )}
                {canEdit && !editing && phase && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-4 py-2 text-sm font-semibold text-[#071426]"
                  >
                    <Pencil size={15} aria-hidden /> {isComplete(current) ? 'Editar reflexión' : 'Escribir reflexión'}
                  </button>
                )}
              </div>
            </div>

            {editing && phase ? (
              <ReflectionEditor member={member} phase={phase} existing={current} onDone={() => setEditing(false)} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {REFLECTION_FIELDS.map(({ key, title }, i) => {
                  const { icon: Icon, color } = META[key]
                  const text = current?.[key]?.trim()
                  return (
                    <li key={key}>
                      <FlipCard
                        accent={color}
                        flipped={flips[i]}
                        onToggle={() => setFlips((f) => f.map((v, j) => (j === i ? !v : v)))}
                        className="h-64"
                        front={
                          <span className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
                            <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${color}22`, color }}>
                              <Icon size={28} aria-hidden />
                            </span>
                            <span className="font-serif text-2xl font-semibold leading-tight text-[var(--text)]">{title}</span>
                            <span className="text-xs text-[var(--text-muted)]">Toca para leer</span>
                          </span>
                        }
                        back={
                          <span className="block p-5">
                            <span className="mb-2 block font-serif text-lg font-semibold" style={{ color: `color-mix(in srgb, ${color} 55%, var(--text))` }}>
                              {title}
                            </span>
                            {text ? (
                              <span className="block whitespace-pre-line leading-relaxed text-[var(--text)]">{text}</span>
                            ) : (
                              <span className="block italic text-[var(--text-muted)]">Aún no hay reflexión en este apartado.</span>
                            )}
                          </span>
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            )}

            {!session && (
              <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
                ¿Eres integrante del grupo?{' '}
                <Link to="/admin" className="text-teal underline underline-offset-4">
                  Inicia sesión en el Modo edición
                </Link>{' '}
                para escribir tus reflexiones.
              </p>
            )}
            {session && !canEdit && (
              <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
                Solo puedes escribir tus propias reflexiones. Selecciona tu tarjeta de integrante para editarlas.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
