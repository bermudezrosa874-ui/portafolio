import { Reveal } from './Reveal'

interface Props {
  id: string
  kicker: string
  title: string
  intro?: string
  align?: 'left' | 'center'
}

export function SectionHeading({ id, kicker, title, intro, align = 'center' }: Props) {
  const center = align === 'center'
  return (
    <Reveal className={`mb-10 ${center ? 'text-center' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal">{kicker}</p>
      <h2 id={id} className="mt-2 font-serif text-4xl font-semibold text-gold sm:text-5xl">
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 max-w-2xl leading-relaxed text-[var(--text-muted)] ${center ? 'mx-auto' : ''}`}>
          {intro}
        </p>
      )}
    </Reveal>
  )
}
