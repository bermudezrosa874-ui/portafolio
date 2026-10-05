import { motion, useScroll, useSpring, useTransform } from 'motion/react'

/** "Inicio ━━●━━ Fin": avanza con el scroll. El relleno usa transform; el marcador, su posición. */
export function ProgressBar() {
  const { scrollYProgress } = useScroll()
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 })
  const left = useTransform(fill, (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`)

  return (
    <div className="flex items-center gap-2 px-4 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] sm:px-6">
      <span aria-hidden>Inicio</span>
      <div className="relative mx-3 h-4 flex-1" role="presentation" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded bg-[var(--border)]" />
        <motion.div
          className="absolute inset-x-0 top-1/2 h-[2px] origin-left -translate-y-1/2 rounded bg-gradient-to-r from-teal via-violet to-gold"
          style={{ scaleX: fill }}
        />
        <motion.span
          className="absolute top-1/2 -ml-2.5 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-[#f5b942] font-sans text-[12px] font-bold leading-none text-abyss shadow"
          style={{ left }}
        >
          π
        </motion.span>
      </div>
      <span aria-hidden>Fin</span>
    </div>
  )
}
