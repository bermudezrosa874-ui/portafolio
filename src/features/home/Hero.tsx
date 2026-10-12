import { useLayoutEffect } from 'react'
import { motion, type Variants } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { useSiteConfig } from '../../lib/queries'
import { scrollToSection } from '../../lib/sections'
import { MathArt } from './MathArt'

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

  // La portada estática del HTML se oculta (sin borrarla) en el mismo cuadro en que aparece esta.
  useLayoutEffect(() => {
    const s = document.getElementById('prerender')
    if (s) s.style.visibility = 'hidden'
  }, [])

  if (!cfg) return null

  return (
    <section
      id="inicio"
      aria-labelledby="titulo-portada"
      className="relative isolate flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-32 sm:px-6"
    >
      <div aria-hidden className="grid-geometrico absolute inset-0 -z-20" />
      <MathArt className="absolute right-4 top-1/2 -z-10 hidden w-[min(26vw,360px)] -translate-y-1/2 xl:block" />

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
          className="mt-4 bg-gradient-to-r from-gold via-[#e7c98a] to-gold [html[data-theme=light]_&]:via-[#c9892a] bg-clip-text font-serif text-6xl font-semibold leading-[0.95] text-transparent sm:text-8xl"
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
