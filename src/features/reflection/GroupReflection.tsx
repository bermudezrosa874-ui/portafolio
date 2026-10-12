import { BookOpen, Compass, Wrench, type LucideIcon } from 'lucide-react'
import { SoonText } from '../../components/SoonText'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useSiteConfig } from '../../lib/queries'

const TEXT_FALLBACK =
  'La construcción de este portafolio permitió integrar diferentes formas de representar el conocimiento. El desarrollo de líneas de tiempo, entrevistas, recursos interactivos y materiales audiovisuales fortaleció no solamente la comprensión de los contenidos académicos, sino también competencias relacionadas con investigación, comunicación, creatividad, trabajo colaborativo y uso de herramientas digitales.'

export function GroupReflection() {
  const { data: cfg } = useSiteConfig()

  const cards: { title: string; hint: string; text: string | undefined; icon: LucideIcon; color: string }[] = [
    { title: 'Conocimiento', hint: 'Qué aprendimos sobre la temática', text: cfg?.reflection_knowledge, icon: BookOpen, color: '#06B6D4' },
    { title: 'Habilidades', hint: 'Qué aprendimos a hacer', text: cfg?.reflection_skills, icon: Wrench, color: '#7C3AED' },
    { title: 'Experiencia', hint: 'Qué nos dejó el proceso', text: cfg?.reflection_experience, icon: Compass, color: '#F5B942' },
  ]

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

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map(({ title, hint, text, icon: Icon, color }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <article
                className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur transition-transform hover:-translate-y-1"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                  <Icon size={24} aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-[var(--text)]">{title}</h3>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{hint}</p>
                <p className="mt-3 leading-relaxed text-[var(--text-muted)]"><SoonText value={text} /></p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
