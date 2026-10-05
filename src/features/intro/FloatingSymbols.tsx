import { useMemo, type ReactNode } from 'react'

// Símbolos numéricos de varias civilizaciones, dibujados como SVG para no depender de fuentes.

const Wedge = () => (
  <svg viewBox="0 0 24 32" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2 L21 15 H13 V30 H11 V15 H3 Z" />
  </svg>
)
const WedgeTen = () => (
  <svg viewBox="0 0 32 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12 L15 3 V11 H30 V13 H15 V21 Z" />
  </svg>
)
const EgyptOne = () => (
  <svg viewBox="0 0 24 32" width="100%" height="100%" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 4V28M12 4V28M18 4V28" />
  </svg>
)
const EgyptTen = () => (
  <svg viewBox="0 0 24 32" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 28V14a7 7 0 0 1 14 0V28" />
  </svg>
)
const MiniSpiral = () => (
  <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M20 20 c1-2 4-2 5 1 s-1 6-5 6 s-8-3-8-8 s5-10 11-10 s13 6 13 14" />
  </svg>
)
const glyph = (c: string): (() => ReactNode) => () => (
  <span className="font-serif text-[1em] leading-none">{c}</span>
)

const KINDS: (() => ReactNode)[] = [
  glyph('π'), glyph('Σ'), glyph('α'), glyph('θ'), glyph('φ'), glyph('∞'), glyph('√'), glyph('Δ'),
  Wedge, WedgeTen, EgyptOne, EgyptTen, MiniSpiral,
]
const COLORS = ['text-gold', 'text-teal', 'text-violet', 'text-gold']

interface Item {
  kind: number
  left: number
  top: number
  size: number
  dur: number
  delay: number
  color: string
  opacity: number
}

// Generador determinista: las posiciones no cambian entre renderizados.
function layout(count: number): Item[] {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: count }, (_, i) => ({
    kind: i % KINDS.length,
    left: 4 + rand() * 90,
    top: 4 + rand() * 88,
    size: 22 + rand() * 30,
    dur: 12 + rand() * 12,
    delay: -rand() * 14,
    color: COLORS[i % COLORS.length],
    opacity: 0.12 + rand() * 0.14,
  }))
}

export function FloatingSymbols({ count = 18 }: { count?: number }) {
  const items = useMemo(() => layout(count), [count])
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => {
        const Glyph = KINDS[it.kind]
        return (
          <div
            key={i}
            className={`drift absolute ${it.color}`}
            style={
              {
                left: `${it.left}%`,
                top: `${it.top}%`,
                width: it.size,
                height: it.size,
                fontSize: it.size,
                opacity: it.opacity,
                '--dur': `${it.dur}s`,
                '--delay': `${it.delay}s`,
              } as React.CSSProperties
            }
          >
            <Glyph />
          </div>
        )
      })}
    </div>
  )
}
