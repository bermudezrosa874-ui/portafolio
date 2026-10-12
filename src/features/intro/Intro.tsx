import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimate } from 'motion/react'
import { useSiteConfig } from '../../lib/queries'
import { FloatingSymbols } from './FloatingSymbols'

type Phase = 'idle' | 'opening' | 'expanding' | 'out'

const PAPER = 'linear-gradient(160deg,#fffaf6 0%,#fde9f3 100%)'
// Papel cuadriculado, como una hoja de matemáticas
const GRID = 'linear-gradient(rgba(168,140,245,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(168,140,245,0.22) 1px,transparent 1px)'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Detalles de matemáticas sobre la carta: fórmulas famosas, un triángulo y una onda. Solo decoración. */
function MathDecor() {
  const ink = 'absolute font-serif italic text-[#8a6fc0]/70 text-[9px] sm:text-xs'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
      <span className={`${ink} left-3 top-2.5`}>
        e<sup>iπ</sup> + 1 = 0
      </span>
      <span className={`${ink} right-3 top-2.5`}>
        a² + b² = c²
      </span>
      <span className={`${ink} bottom-2.5 left-3`}>φ = (1 + √5) / 2</span>
      <span className={`${ink} bottom-2.5 right-3`}>Σ 1/n² = π²/6</span>

      {/* Triángulo rectángulo con su ángulo recto */}
      <svg viewBox="0 0 60 50" className="absolute left-3 top-9 h-9 w-11 text-[#d98ab8]/80 sm:top-11 sm:h-12 sm:w-14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M4 44 H54 L4 6 Z" />
        <path d="M4 36 H12 V44" />
      </svg>

      {/* Circunferencia con su radio y su centro */}
      <svg viewBox="0 0 50 50" className="absolute right-3 top-9 h-9 w-9 text-[#69a9d9]/80 sm:top-11 sm:h-12 sm:w-12" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="25" cy="25" r="20" />
        <path d="M25 25 L41 15" />
        <circle cx="25" cy="25" r="1.8" fill="currentColor" />
      </svg>

      {/* Onda seno */}
      <svg viewBox="0 0 120 20" preserveAspectRatio="none" className="absolute inset-x-6 bottom-8 h-4 w-[calc(100%-3rem)] text-[#a88cf5]/70 sm:bottom-9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M0 10 C10 -2 20 -2 30 10 S50 22 60 10 S80 -2 90 10 S110 22 120 10" />
      </svg>
    </div>
  )
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const { data: cfg } = useSiteConfig()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [phase, setPhase] = useState<Phase>('idle')
  const [rect, setRect] = useState<DOMRect | null>(null)
  const sealRef = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onDone()
  }, [onDone])

  // Bloquea el scroll de la página mientras la carta está visible y enfoca el sello.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sealRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const open = async () => {
    if (phase !== 'idle') return
    setPhase('opening')
    try {
      // Tiempos fijos: no se depende de que la promesa de la secuencia se resuelva.
      void Promise.resolve(
        animate([
          ['.seal-l', { x: -18, y: 14, rotate: -24, opacity: 0 }, { duration: 0.55, at: 0 }],
          ['.seal-r', { x: 18, y: 14, rotate: 24, opacity: 0 }, { duration: 0.55, at: 0 }],
          ['.flap', { rotateX: -180 }, { duration: 0.9, ease: 'easeInOut', at: 0.25 }],
          ['.letter', { y: '-72%' }, { duration: 1.2, ease: [0.22, 1, 0.36, 1], at: 0.95 }],
        ]),
      ).catch(() => undefined)
      const flap = scope.current?.querySelector<HTMLElement>('.flap')
      window.setTimeout(() => flap && (flap.style.zIndex = '1'), 600) // la solapa pasa detrás de la carta
      await wait(2150 + 1000) // animación + pausa para leer la carta
      const el = scope.current?.querySelector('.letter')
      if (el) {
        setRect(el.getBoundingClientRect())
        setPhase('expanding')
      } else {
        setPhase('out')
      }
    } catch {
      setPhase('out')
    }
  }

  return (
    <motion.div
      ref={scope}
      role="dialog"
      aria-modal="true"
      aria-label="Carta de bienvenida"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      onAnimationComplete={() => phase === 'out' && finish()}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-image), var(--bg)' }}
    >
      <FloatingSymbols />


      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-32 aspect-[4/3] w-[min(88vw,440px)]"
        style={{ perspective: 1400 }}
      >
        {/* Fondo interior del sobre */}
        <div className="absolute inset-0 rounded-md bg-[linear-gradient(180deg,#e6d9fb,#d3c1f6)] shadow-[0_30px_60px_-24px_rgba(88,60,140,0.55)]" />

        {/* Carta */}
        <div
          className="letter absolute inset-x-[6%] top-[4%] z-10 flex h-[90%] flex-col items-center justify-center rounded-[3px] px-5 text-center text-[#3b2a66] shadow-md sm:px-8"
          style={{ background: `${GRID}, ${PAPER}`, backgroundSize: '18px 18px, 18px 18px, auto' }}
        >
          <MathDecor />
          <h2 className="font-serif text-3xl font-semibold leading-none sm:text-5xl">{cfg?.title}</h2>
          <span aria-hidden className="my-3 block h-px w-16 bg-[#e3a3c8] sm:my-4" />
          <p className="font-serif text-xs italic leading-snug text-[#6d5a8f] sm:text-base">{cfg?.subtitle}</p>
        </div>

        {/* Bolsillo frontal */}
        <svg
          viewBox="0 0 300 225"
          preserveAspectRatio="none"
          className="absolute inset-0 z-20 h-full w-full"
          aria-hidden
        >
          <polygon points="0,0 150,118 0,225" fill="#c4b0f4" />
          <polygon points="300,0 150,118 300,225" fill="#b9a4ef" />
          <polygon points="0,225 150,105 300,225" fill="#cdbaf7" />
          <path
            d="M0 0 L150 118 L300 0 M0 225 L150 105 L300 225"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.6"
            strokeWidth="0.8"
          />
        </svg>

        {/* Solapa (3D) */}
        <div
          className="flap absolute inset-x-0 top-0 z-30 h-[55%]"
          style={{ transformOrigin: 'top', transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{
              clipPath: 'polygon(0 0,100% 0,50% 100%)',
              background: 'linear-gradient(180deg,#dccdfa,#c4b0f4)',
            }}
          />
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{
              clipPath: 'polygon(0 0,100% 0,50% 100%)',
              background: 'linear-gradient(0deg,#b9a4ef,#c9b7f6)',
              transform: 'rotateX(180deg)',
            }}
          />
        </div>

        {/* Sello de lacre */}
        <div className="absolute left-1/2 top-[55%] z-40 -translate-x-1/2 -translate-y-1/2">
          <motion.span
            aria-hidden
            className="seal-ring absolute inset-0 rounded-full border-2 border-[#f1a8d4]"
            animate={phase === 'idle' ? { scale: [1, 1.6], opacity: [0.55, 0] } : { opacity: 0 }}
            transition={
              phase === 'idle' ? { duration: 2, repeat: Infinity, ease: 'easeOut' } : { duration: 0.1 }
            }
          />
          <motion.button
            ref={sealRef}
            type="button"
            onClick={open}
            aria-label="Abrir la carta"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            className="relative grid h-16 w-16 place-items-center rounded-full"
          >
            {(['seal-l', 'seal-r'] as const).map((side) => (
              <span
                key={side}
                className={`${side} absolute inset-0 grid place-items-center rounded-full font-serif text-3xl font-semibold text-[#6b2146] shadow-[inset_0_0_0_3px_rgba(107,33,70,0.25),0_4px_12px_rgba(88,60,140,0.45)]`}
                style={{
                  background: 'radial-gradient(circle at 35% 30%,#ffe3f1,#f1a8d4 55%,#c9669a)',
                  clipPath: side === 'seal-l' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                }}
              >
                π
              </span>
            ))}
          </motion.button>
        </div>
      </motion.div>

      <p className="relative z-10 mt-12 text-sm tracking-widest text-[var(--text-muted)]" aria-live="polite">
        {phase === 'idle' ? 'Toca el sello para abrir' : ' '}
      </p>

      {phase === 'expanding' && rect && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[120] origin-top-left"
          style={{ background: PAPER }}
          initial={{
            x: rect.left,
            y: rect.top,
            scaleX: rect.width / window.innerWidth,
            scaleY: rect.height / window.innerHeight,
          }}
          animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1 }}
          transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
          onAnimationComplete={() => setPhase('out')}
        />
      )}
    </motion.div>
  )
}
