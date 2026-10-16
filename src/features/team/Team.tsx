import { useState } from 'react'
import { SoonText } from '../../components/SoonText'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { inkOf, memberColor, plainName, tintOf } from '../../lib/members'
import { useSiteConfig } from '../../lib/queries'
import { MemberAvatar, SymbolBadge } from './MemberBits'
import { ParticipationBlock } from './ParticipationBlock'
import { ProfileModal } from './ProfileModal'
import { useParticipation, type MemberStats } from './participation'

const TEXT_FALLBACK =
  'Este proyecto fue desarrollado mediante el trabajo colaborativo de los integrantes del grupo, quienes participaron en las diferentes etapas de investigación, diseño, producción y construcción de los recursos académicos.'

function MemberCard({ s, onOpen }: { s: MemberStats; onOpen: () => void }) {
  const m = s.member
  const color = memberColor(m)
  return (
    <article
      className="relative flex h-full flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition-transform hover:-translate-y-1 hover:shadow-xl"
      style={{ borderTop: `4px solid ${color}`, backgroundImage: `linear-gradient(180deg, ${tintOf(color, 12)}, transparent 55%)` }}
    >
      {m.symbol && <SymbolBadge symbol={m.symbol} color={color} size={40} className="absolute right-4 top-4" />}
      <div className="mx-auto">
        <MemberAvatar member={m} size={96} />
      </div>
      <div>
        <h3 className="font-serif text-2xl font-semibold leading-tight text-[var(--text)]">{plainName(m.name)}</h3>
        <p className="text-sm text-[var(--text-muted)]">{m.topic}</p>
        <span className="mt-2 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: tintOf(color, 22), color: inkOf(color) }}>
          <SoonText value={m.role} />
        </span>
      </div>

      {m.about && <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text)]">{m.about}</p>}
      {m.quote && (
        <p className="line-clamp-2 font-serif text-base italic leading-snug" style={{ color: inkOf(color) }}>
          «{m.quote}»
        </p>
      )}

      <div className="rounded-xl p-3 text-left" style={{ background: tintOf(color, 9) }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Aporte principal al proyecto</p>
        <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-[var(--text)]">
          <SoonText value={m.contribution} />
        </p>
      </div>

      <p className="text-xs tabular-nums text-[var(--text-muted)]">
        Bitácora {s.bitacoraDone}/{s.bitacoraTotal} · Reflexión grupal {s.groupDone}/{s.groupTotal}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-auto inline-flex min-h-10 items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold transition-colors after:absolute after:inset-0 after:rounded-3xl hover:bg-[var(--hover)]"
        style={{ borderColor: color, color: inkOf(color) }}
        aria-label={`Ver el perfil completo de ${plainName(m.name)}`}
      >
        Ver perfil completo
      </button>
    </article>
  )
}

export function Team() {
  const { data: cfg } = useSiteConfig()
  const { list, summary, isLoading, phases } = useParticipation()
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = list.find((s) => s.member.id === openId) ?? null

  return (
    <section
      id="equipo"
      aria-labelledby="equipo-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="equipo-titulo"
          kicker="Quiénes somos"
          title="Nuestro equipo"
          intro={cfg?.team_text || TEXT_FALLBACK}
        />

        {cfg && (
          <Reveal className="mx-auto mb-10 max-w-3xl">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-3">
              {(
                [
                  ['Asignatura', cfg.course],
                  ['Universidad', cfg.university],
                  ['Programa', cfg.program],
                  ['Docente', cfg.teacher],
                  ['Periodo', cfg.period],
                  ['Grupo', cfg.group_name],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{label}</dt>
                  <dd className="text-sm text-[var(--text)]"><SoonText value={value} /></dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        <ul className="flex flex-wrap justify-center gap-5">
          {list.map((s, i) => (
            <li key={s.member.id} className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)]">
              <Reveal delay={(i % 3) * 0.08} className="h-full">
                <MemberCard s={s} onOpen={() => setOpenId(s.member.id)} />
              </Reveal>
            </li>
          ))}
        </ul>

        <ParticipationBlock stats={list} summary={summary} loading={isLoading} onOpen={setOpenId} />
      </div>

      <ProfileModal stats={opened} phases={phases} onClose={() => setOpenId(null)} />
    </section>
  )
}
