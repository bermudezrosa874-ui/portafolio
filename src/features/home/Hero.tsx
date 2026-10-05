import { useLayoutEffect } from 'react'
import { motion, type Variants } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { useMembers, useSiteConfig } from '../../lib/queries'
import { scrollToSection } from '../../lib/sections'
import { ArchimedesSpiral } from './ArchimedesSpiral'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  const { data: cfg } = useSiteConfig()
  const { data: members } = useMembers()

  // La portada estática del HTML se oculta (sin borrarla) en el mismo cuadro en que aparece esta.
  useLayoutEffect(() => {
    const s = document.getElementById('prerender')
    if (s) s.style.visibility = 'hidden'
  }, [])

  if (!cfg) return null

  const details: [string, string][] = [
    ['Asignatura', cfg.course],
    ['Universidad', cfg.university],
    ['Programa', cfg.program],
    ['Docente', cfg.teacher],
    ['Periodo', cfg.period],
    ['Grupo', cfg.group_name],
  ]

  return (
    <section
      id="inicio"
      aria-labelledby="titulo-portada"
      className="relative isolate flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-32 sm:px-6"
    >
      <div aria-hidden className="grid-geometrico absolute inset-0 -z-20" />
      <ArchimedesSpiral className="absolute -right-24 top-1/2 -z-10 w-[min(120vw,760px)] -translate-y-1/2 opacity-30 sm:right-0 sm:opacity-40" />

      <motion.div
        variants={container}
        initial={(window as unknown as { __prerendered?: boolean }).__prerendered ? false : 'hidden'}
        animate="show"
        className="mx-auto w-full max-w-5xl"
      >
        <motion.p
          variants={item}
          className="text-xs font-medium uppercase tracking-[0.3em] text-teal sm:text-sm"
        >
          {cfg.course} · UNAD
        </motion.p>

        <motion.h1
          id="titulo-portada"
          variants={item}
          className="mt-4 bg-gradient-to-r from-gold via-[#ffe4a3] to-gold bg-clip-text font-serif text-6xl font-semibold leading-[0.95] text-transparent sm:text-8xl"
        >
          {cfg.title}
        </motion.h1>

        <motion.p variants={item} className="mt-5 max-w-2xl font-serif text-2xl text-[var(--text)] sm:text-3xl">
          {cfg.subtitle}
        </motion.p>

        <motion.p variants={item} className="mt-3 font-serif text-lg italic text-gold/90">
          “{cfg.motto}”
        </motion.p>

        <motion.p variants={item} className="mt-8 max-w-2xl leading-relaxed text-[var(--text-muted)]">
          {cfg.intro_text}
        </motion.p>

        <motion.dl variants={item} className="mt-8 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{label}</dt>
              <dd className="text-sm text-[var(--text)]">{value}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div variants={item} className="mt-8">
          <h2 className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Integrantes</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {members?.map((m) => (
              <li
                key={m.id}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm backdrop-blur"
              >
                {m.name} <span className="text-gold">· {m.topic}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={item} className="mt-10">
          <motion.button
            type="button"
            onClick={() => scrollToSection('sobre')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f5b942] to-[#ffd37a] px-7 py-3.5 text-base font-semibold text-abyss shadow-[0_8px_30px_-8px_rgba(245,185,66,0.7)]"
          >
            Explorar portafolio <ArrowDown size={18} aria-hidden />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}
