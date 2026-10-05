import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { SectionHeading } from '../../components/SectionHeading'
import { useLearningData } from '../../lib/queries'
import { ui } from '../../lib/uiStore'
import type { Moment, Phase } from '../../types'

// Paradas del camino en un lienzo de 100×100 (x, y en %). Coinciden con la curva dibujada.
const POINTS: [number, number][] = [
  [50, 5],
  [24, 28],
  [76, 50],
  [24, 72],
  [50, 95],
]

/** Curva suave por las paradas, en píxeles reales (sin deformar el trazo). */
function curve(points: [number, number][], w: number, h: number): string {
  const px = points.map(([x, y]) => [(x / 100) * w, (y / 100) * h] as const)
  let d = `M${px[0][0].toFixed(1)} ${px[0][1].toFixed(1)}`
  for (let i = 1; i < px.length; i++) {
    const [x1, y1] = px[i - 1]
    const [x2, y2] = px[i]
    const my = (y1 + y2) / 2
    d += ` C${x1.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return d
}

interface StopProps {
  phase: Phase
  moment: Moment | undefined
  x: number
  y: number
  threshold: number
  progress: MotionValue<number>
}

function Stop({ phase, moment, x, y, threshold, progress }: StopProps) {
  const reduce = useReducedMotion()
  const lit = useTransform(progress, [Math.max(threshold - 0.06, 0), threshold], [0.45, 1])
  const color = moment?.color ?? '#F5B942'
  const side: 'left' | 'right' = x > 60 ? 'left' : 'right'

  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <motion.button
        type="button"
        onClick={() => ui.revealPhase(phase.id, phase.moment_id)}
        aria-label={`Ir a la Fase ${phase.id}: ${phase.title}`}
        style={reduce ? { borderColor: color } : { opacity: lit, borderColor: color }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.94 }}
        className="group absolute -left-[22px] -top-[22px] grid h-11 w-11 place-items-center rounded-full border-2 bg-abyss font-serif text-xl font-semibold text-[#f3f4f6] shadow-lg"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full opacity-30 blur-md transition-opacity group-hover:opacity-70"
          style={{ background: color }}
        />
        {phase.id}
      </motion.button>
      <div
        className={`pointer-events-none absolute top-0 w-[min(38vw,230px)] -translate-y-1/2 ${
          side === 'right' ? 'left-full ml-8 text-left' : 'right-full mr-8 text-right'
        }`}
      >
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: `color-mix(in srgb, ${color} 55%, var(--text))` }}>
          Fase {phase.id} · {phase.rac}
        </p>
        <p className="mt-0.5 font-serif text-base leading-snug text-[var(--text)] sm:text-lg">{phase.title}</p>
      </div>
    </div>
  )
}

export function RouteMap() {
  const { data } = useLearningData()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const path = box.w ? curve(POINTS, box.w, box.h) : ''
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })

  const phases = data?.phases ?? []
  const momentOf = (id: Phase['moment_id']) => data?.moments.find((m) => m.id === id)

  return (
    <section
      id="recorrido"
      aria-labelledby="recorrido-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          id="recorrido-titulo"
          kicker="Mapa del curso"
          title="Nuestro recorrido"
          intro="Cinco paradas, cinco fases. Toca una parada para ir directo a su fase en Aprendizajes."
        />

        <div ref={ref} className="relative mx-auto h-[780px] w-full sm:h-[840px]">
          <svg
            viewBox={`0 0 ${box.w || 1} ${box.h || 1}`}
            aria-hidden
            focusable="false"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <path d={path} fill="none" stroke="var(--border)" strokeWidth={2} strokeDasharray="2 7" />
            <motion.path
              d={path}
              fill="none"
              stroke="url(#ruta-grad)"
              strokeWidth={3}
              strokeLinecap="round"
              style={{ pathLength: reduce ? 1 : scrollYProgress }}
            />
            <defs>
              <linearGradient id="ruta-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#06B6D4" />
                <stop offset="0.5" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#F5B942" />
              </linearGradient>
            </defs>
          </svg>

          {phases.slice(0, POINTS.length).map((phase, i) => (
            <Stop
              key={phase.id}
              phase={phase}
              moment={momentOf(phase.moment_id)}
              x={POINTS[i][0]}
              y={POINTS[i][1]}
              threshold={i / (POINTS.length - 1)}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
