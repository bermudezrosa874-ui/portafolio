import type { PointerEvent } from 'react'
import { useMotionValue, useReducedMotion, useSpring } from 'motion/react'

/** Inclinación 3D sutil al pasar el mouse. No actúa con touch, lápiz ni movimiento reducido. */
export function useTilt(max = 7) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(rx, { stiffness: 220, damping: 22 })
  const rotateY = useSpring(ry, { stiffness: 220, damping: 22 })

  return {
    style: { rotateX, rotateY, transformPerspective: 900 },
    handlers: {
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (reduce || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        ry.set(px * max * 2)
        rx.set(-py * max * 2)
      },
      onPointerLeave: () => {
        rx.set(0)
        ry.set(0)
      },
    },
  }
}
