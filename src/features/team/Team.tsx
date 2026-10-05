import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { FlipCard } from '../../components/FlipCard'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useMembers, useSiteConfig } from '../../lib/queries'

const TEXT_FALLBACK =
  'Este proyecto fue desarrollado mediante el trabajo colaborativo de los integrantes del grupo, quienes participaron en las diferentes etapas de investigación, diseño, producción y construcción de los recursos académicos.'
const COLORS = ['#F5B942', '#06B6D4', '#7C3AED', '#2563EB', '#F5B942']

export function Team() {
  const { data: members = [] } = useMembers()
  const { data: cfg } = useSiteConfig()
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

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

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <li key={m.id}>
                <Reveal delay={(i % 3) * 0.08}>
                  <FlipCard
                    accent={color}
                    className="h-[22rem]"
                    flipped={!!flipped[m.id]}
                    onToggle={() => setFlipped((f) => ({ ...f, [m.id]: !f[m.id] }))}
                    front={
                      <span className="flex h-full flex-col items-center gap-2 p-6 text-center">
                        <Avatar name={m.name} photoPath={m.photo_path} size={96} className="ring-4 ring-[var(--border)]" />
                        <span className="mt-2 font-serif text-2xl font-semibold leading-tight text-[var(--text)]">{m.name}</span>
                        <span className="text-sm text-[var(--text-muted)]">{m.program}</span>
                        <span className="mt-1 rounded-full px-3 py-1 text-sm font-medium" style={{ background: `${color}22`, color: 'var(--text)' }}>
                          Tema: {m.topic}
                        </span>
                        <span className="mt-1 text-sm leading-snug text-[var(--text-muted)]">
                          <span className="block text-[11px] uppercase tracking-widest">Rol en el proyecto</span>
                          {m.role}
                        </span>
                        <span className="mt-auto text-xs text-[var(--text-muted)]">Toca para ver su aporte</span>
                      </span>
                    }
                    back={
                      <span className="flex h-full flex-col p-6">
                        <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Aporte principal al proyecto</span>
                        <span className="mt-1 font-serif text-xl font-semibold text-[var(--text)]">{m.name}</span>
                        <span className="mt-3 block whitespace-pre-line leading-relaxed text-[var(--text)]">{m.contribution}</span>
                      </span>
                    }
                  />
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
