import { motion, useReducedMotion } from 'motion/react'

// Paleta sobria: índigo, azul y turquesa, con un toque dorado apagado.
const INDIGO = '#6366F1'
const BLUE = '#3B82F6'
const TEAL = '#14B8A6'
const GOLD = '#D4A24C'

const SYMBOLS: { glyph: string; x: number; y: number; color: string; delay: number }[] = [
  { glyph: '∞', x: 60, y: 90, color: INDIGO, delay: 0 },
  { glyph: '√', x: 300, y: 70, color: TEAL, delay: 0.8 },
  { glyph: 'Σ', x: 330, y: 250, color: BLUE, delay: 1.6 },
  { glyph: '∫', x: 48, y: 290, color: TEAL, delay: 0.4 },
  { glyph: 'θ', x: 180, y: 392, color: INDIGO, delay: 1.2 },
  { glyph: 'Δ', x: 190, y: 28, color: BLUE, delay: 2 },
]

/** Composición de símbolos matemáticos: ejes, una onda seno, anillos y símbolos que flotan despacio. */
export function MathArt({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  const serif = 'Cormorant Garamond, Georgia, serif'

  return (
    <svg viewBox="0 0 380 420" className={className} fill="none" aria-hidden role="presentation">
      <defs>
        <linearGradient id="mathart-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INDIGO} />
          <stop offset="1" stopColor={TEAL} />
        </linearGradient>
        <linearGradient id="mathart-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={INDIGO} stopOpacity="0" />
          <stop offset="0.25" stopColor={INDIGO} />
          <stop offset="0.75" stopColor={TEAL} />
          <stop offset="1" stopColor={TEAL} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ejes cartesianos */}
      <g stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2" className="text-slate-500">
        <path d="M30 210 H350" />
        <path d="M190 40 V380" />
        <path d="M344 205 L350 210 L344 215" />
        <path d="M185 46 L190 40 L195 46" />
      </g>

      {/* Anillos */}
      <circle cx="190" cy="210" r="128" stroke="url(#mathart-main)" strokeWidth="1.6" strokeOpacity="0.85" />
      <motion.circle
        cx="190"
        cy="210"
        r="152"
        stroke={BLUE}
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeDasharray="3 9"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />

      {/* Onda seno */}
      <path d="M30 210 C 70 120, 110 120, 150 210 S 230 300, 270 210 S 330 120, 350 170" stroke="url(#mathart-wave)" strokeWidth="2.2" strokeLinecap="round" />

      {/* π central */}
      <text x="190" y="252" textAnchor="middle" fontFamily={serif} fontSize="150" fontWeight="600" fill="url(#mathart-main)">
        π
      </text>

      {/* Puntos dorados sobre el anillo */}
      <circle cx="190" cy="82" r="4" fill={GOLD} />
      <circle cx="318" cy="210" r="4" fill={GOLD} />
      <circle cx="62" cy="210" r="4" fill={GOLD} />

      {/* Símbolos que flotan */}
      {SYMBOLS.map((s) => (
        <motion.g
          key={s.glyph}
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        >
          <circle cx={s.x} cy={s.y} r="24" fill="currentColor" fillOpacity="0.07" stroke={s.color} strokeOpacity="0.7" strokeWidth="1.4" className="text-slate-400" />
          <text x={s.x} y={s.y + 10} textAnchor="middle" fontFamily={serif} fontSize="30" fontWeight="600" fill={s.color}>
            {s.glyph}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}
