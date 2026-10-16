import { ChevronRight } from 'lucide-react'
import { Reveal } from '../../components/Reveal'
import { activeAgo, firstName, inkOf, memberColor, plainName, tintOf } from '../../lib/members'
import { Bar, MemberAvatar } from './MemberBits'
import type { MemberStats, TeamSummary } from './participation'

const SUMMARY: { key: keyof TeamSummary; label: string }[] = [
  { key: 'reflexiones', label: 'Reflexiones escritas' },
  { key: 'aportes', label: 'Aportes publicados' },
  { key: 'recursos', label: 'Recursos publicados' },
  { key: 'evidencias', label: 'Evidencias publicadas' },
]

/** «Participación del equipo»: resumen del grupo y una fila por integrante, todo con datos reales. */
export function ParticipationBlock({
  stats,
  summary,
  loading,
  onOpen,
}: {
  stats: MemberStats[]
  summary: TeamSummary
  loading: boolean
  onOpen: (memberId: string) => void
}) {
  return (
    <section aria-labelledby="participacion-titulo" className="mt-16">
      <Reveal>
        <h3 id="participacion-titulo" className="text-center font-serif text-3xl font-semibold text-[var(--text)]">
          Participación del equipo
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[var(--text-muted)]">Lo que cada integrante ha escrito y publicado hasta hoy. Toca a una persona para conocerla.</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {SUMMARY.map(({ key, label }) => (
            <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <dd className="font-serif text-4xl font-semibold tabular-nums text-gold">{loading ? '–' : summary[key]}</dd>
              <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
            </div>
          ))}
        </dl>

        <ul className="mt-6 space-y-3">
          {stats.map((s) => {
            const m = s.member
            const color = memberColor(m)
            const published = s.items.length
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onOpen(m.id)}
                  aria-label={`Ver el perfil completo de ${plainName(m.name)}`}
                  className="grid w-full items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[minmax(0,13rem)_1fr_1fr_8rem_9rem_auto]"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <MemberAvatar member={m} size={48} badge />
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-lg font-semibold leading-tight text-[var(--text)]">{firstName(m.name)}</span>
                      <span className="block truncate text-xs" style={{ color: inkOf(color) }}>
                        {m.topic}
                      </span>
                    </span>
                  </span>

                  <span className="space-y-1">
                    <span className="block text-xs text-[var(--text-muted)]">Bitácora</span>
                    <Bar value={s.bitacoraDone} max={s.bitacoraTotal} color={color} label={`Fases de bitácora completadas de ${firstName(m.name)}`} />
                    <span className="block text-xs tabular-nums text-[var(--text)]">
                      {s.bitacoraDone}/{s.bitacoraTotal} fases
                    </span>
                  </span>

                  <span className="space-y-1">
                    <span className="block text-xs text-[var(--text-muted)]">Reflexión grupal</span>
                    <Bar value={s.groupDone} max={s.groupTotal} color={color} label={`Aportes a la reflexión grupal de ${firstName(m.name)}`} />
                    <span className="block text-xs tabular-nums text-[var(--text)]">
                      {s.groupDone}/{s.groupTotal} aportes
                    </span>
                  </span>

                  <span>
                    <span className="block text-xs text-[var(--text-muted)]">Publicó</span>
                    {published > 0 ? (
                      <span className="font-serif text-2xl font-semibold tabular-nums" style={{ color: inkOf(color) }}>
                        {published}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">Aún no ha publicado</span>
                    )}
                  </span>

                  <span className="text-sm text-[var(--text)]">
                    <span className="mb-0.5 block text-xs text-[var(--text-muted)]">Actividad</span>
                    {s.lastActivity ? activeAgo(s.lastActivity) : <span className="text-[var(--text-muted)]">Aún no ha publicado</span>}
                  </span>

                  <span className="hidden h-8 w-8 place-items-center rounded-full md:grid" style={{ background: tintOf(color, 18), color: inkOf(color) }} aria-hidden>
                    <ChevronRight size={18} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Reveal>
    </section>
  )
}
