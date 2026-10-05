import { motion, useReducedMotion } from 'motion/react'

/** Espiral de Arquímedes r = a·θ, calculada una sola vez como polilínea. */
function spiralPath(turns: number, spacing: number, cx: number, cy: number): string {
  const a = spacing / (2 * Math.PI)
  const steps = turns * 90
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * turns * 2 * Math.PI
    const r = a * theta
    const x = cx + r * Math.cos(theta)
    const y = cy + r * Math.sin(theta)
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return points.join(' ')
}

const PATH = spiralPath(7, 22, 200, 200)

export function ArchimedesSpiral({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 400 400" aria-hidden focusable="false" className={className}>
      <motion.path
        d={PATH}
        fill="none"
        stroke="url(#spiral-grad)"
        strokeWidth={1.6}
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 5, ease: 'easeInOut', delay: 0.4 }}
      />
      <defs>
        <linearGradient id="spiral-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5B942" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  )
}
