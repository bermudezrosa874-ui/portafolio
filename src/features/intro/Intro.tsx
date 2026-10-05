import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useMembers, useSiteConfig } from '../../lib/queries'
import { INTRO_KEY, writeFlag } from '../../lib/safeStorage'
import { FloatingSymbols } from './FloatingSymbols'

type Phase = 'idle' | 'opening' | 'expanding' | 'out'

const PAPER = 'linear-gradient(160deg,#f7edd0 0%,#efe0b8 100%)'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function Intro({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const { data: cfg } = useSiteConfig()
  const { data: members } = useMembers()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [phase, setPhase] = useState<Phase>('idle')
  const [rect, setRect] = useState<DOMRect | null>(null)
  const sealRef = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    writeFlag(INTRO_KEY, '1')
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

  const skip = useCallback(() => {
    writeFlag(INTRO_KEY, '1')
    setPhase('out')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skip()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  const open = async () => {
    if (phase !== 'idle') return
    writeFlag(INTRO_KEY, '1')
    if (reduce) {
      setPhase('out')
      return
    }
    setPhase('opening')
    try {
      // Tiempos fijos: no se depende de que la promesa de la secuencia se resuelva.
      void Promise.resolve(
        animate([
          ['.seal-l', { x: -18, y: 14, rotate: -24, opacity: 0 }, { duration: 0.35, at: 0 }],
          ['.seal-r', { x: 18, y: 14, rotate: 24, opacity: 0 }, { duration: 0.35, at: 0 }],
          ['.flap', { rotateX: -180 }, { duration: 0.55, ease: 'easeInOut', at: 0.15 }],
          ['.letter', { y: '-72%' }, { duration: 0.75, ease: [0.22, 1, 0.36, 1], at: 0.55 }],
        ]),
      ).catch(() => undefined)
      const flap = scope.current?.querySelector<HTMLElement>('.flap')
      window.setTimeout(() => flap && (flap.style.zIndex = '1'), 350) // la solapa pasa detrás de la carta
      await wait(1300 + 650) // animación + pausa para leer la carta
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
      transition={{ duration: 0.45 }}
      onAnimationComplete={() => phase === 'out' && finish()}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#0c1d36_0%,#071426_70%)]"
    >
      <FloatingSymbols />

      <button
        type="button"
        onClick={skip}
        className="absolute right-4 top-4 z-50 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-widest text-slate-300 hover:border-gold hover:text-gold"
      >
        Saltar intro
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-32 aspect-[4/3] w-[min(88vw,440px)]"
        style={{ perspective: 1400 }}
      >
        {/* Fondo interior del sobre */}
        <div className="absolute inset-0 rounded-md bg-[linear-gradient(180deg,#14305a,#0d2244)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]" />

        {/* Carta */}
        <div
          className="letter absolute inset-x-[6%] top-[4%] z-10 h-[90%] rounded-[3px] p-4 text-[#3b2a14] shadow-md sm:p-6"
          style={{ background: PAPER }}
        >
          <p className="font-serif text-[9px] uppercase tracking-[0.28em] text-[#8a6a2a] sm:text-[11px]">
            {cfg?.course} · UNAD
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold leading-none sm:text-4xl">{cfg?.title}</h2>
          <p className="mt-1.5 font-serif text-[11px] italic leading-snug text-[#5a4524] sm:text-sm">
            {cfg?.subtitle}
          </p>
          <hr className="my-2 border-[#b89b5a]/50 sm:my-3" />
          <ul className="space-y-0.5 text-[10px] leading-tight sm:text-xs">
            {members?.map((m) => (
              <li key={m.id}>
                <span className="font-semibold">{m.name}</span>
                <span className="text-[#7a5d2c]"> — {m.topic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bolsillo frontal */}
        <svg
          viewBox="0 0 300 225"
          preserveAspectRatio="none"
          className="absolute inset-0 z-20 h-full w-full"
          aria-hidden
        >
          <polygon points="0,0 150,118 0,225" fill="#183a6b" />
          <polygon points="300,0 150,118 300,225" fill="#163561" />
          <polygon points="0,225 150,105 300,225" fill="#1d4580" />
          <path
            d="M0 0 L150 118 L300 0 M0 225 L150 105 L300 225"
            fill="none"
            stroke="#F5B942"
            strokeOpacity="0.25"
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
              background: 'linear-gradient(180deg,#1f4d8f,#183a6b)',
            }}
          />
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{
              clipPath: 'polygon(0 0,100% 0,50% 100%)',
              background: 'linear-gradient(0deg,#0f2a52,#14305a)',
              transform: 'rotateX(180deg)',
            }}
          />
        </div>

        {/* Sello de lacre */}
        <div className="absolute left-1/2 top-[55%] z-40 -translate-x-1/2 -translate-y-1/2">
          <motion.span
            aria-hidden
            className="seal-ring absolute inset-0 rounded-full border-2 border-gold"
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
                className={`${side} absolute inset-0 grid place-items-center rounded-full font-serif text-3xl font-semibold text-[#5b3b0a] shadow-[inset_0_0_0_3px_rgba(91,59,10,0.25),0_4px_12px_rgba(0,0,0,0.5)]`}
                style={{
                  background: 'radial-gradient(circle at 35% 30%,#ffe29a,#f5b942 55%,#b9801f)',
                  clipPath: side === 'seal-l' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                }}
              >
                π
              </span>
            ))}
          </motion.button>
        </div>
      </motion.div>

      <p className="relative z-10 mt-12 text-sm tracking-widest text-slate-300" aria-live="polite">
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
          transition={{ duration: 0.75, ease: [0.7, 0, 0.2, 1] }}
          onAnimationComplete={() => setPhase('out')}
        />
      )}
    </motion.div>
  )
}
