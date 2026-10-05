import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, RotateCcw, X } from 'lucide-react'
import { useQuizQuestions } from '../../lib/queries'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Quiz() {
  const { data: questions = [], isLoading, isError } = useQuizQuestions()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)

  const q = questions[index]
  const answered = picked !== null
  const correct = answered && picked === q?.correct_index

  // Tras responder, el foco pasa al botón «Siguiente» para seguir solo con el teclado.
  useEffect(() => {
    if (answered) nextRef.current?.focus()
  }, [answered])

  const choose = (i: number) => {
    if (answered || !q) return
    setPicked(i)
    if (i === q.correct_index) setScore((s) => s + 1)
  }
  const next = () => {
    if (index + 1 >= questions.length) setFinished(true)
    else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }
  const restart = () => {
    setIndex(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-[var(--surface)]" aria-busy="true" aria-label="Cargando preguntas" />
  if (isError || questions.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">Aún no hay preguntas disponibles.</p>
  }

  if (finished) {
    const ratio = score / questions.length
    const message =
      ratio === 1 ? '¡Excelente! Conoces muy bien a nuestros personajes.' : ratio >= 0.6 ? '¡Muy bien! Ya casi lo dominas.' : 'Buen intento. Explora el portafolio y vuelve a jugar.'
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center" role="status">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal">Resultado</p>
        <p className="mt-2 font-serif text-6xl font-semibold text-gold">
          {score}/{questions.length}
        </p>
        <p className="mt-3 text-[var(--text)]">{message}</p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-6 py-3 font-semibold text-[#071426] active:scale-95"
        >
          <RotateCcw size={18} aria-hidden /> Jugar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>
          Pregunta {index + 1} de {questions.length}
        </span>
        <span className="tabular-nums">Aciertos: {score}</span>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {questions.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-teal' : i === index ? 'bg-gold' : 'bg-[var(--border)]'}`} />
        ))}
      </div>

      <h4 className="mt-5 font-serif text-2xl font-semibold leading-snug text-[var(--text)]">{q.question}</h4>

      <div role="group" aria-label="Opciones de respuesta" className="mt-5 grid gap-3">
        {q.options.map((opt, i) => {
          const isRight = answered && i === q.correct_index
          const isWrong = answered && i === picked && i !== q.correct_index
          return (
            <motion.button
              key={`${q.id}-${i}`}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              whileTap={reduce || answered ? undefined : { scale: 0.98 }}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default ${
                isRight
                  ? 'border-emerald-500 bg-emerald-500/15 text-[var(--text)]'
                  : isWrong
                    ? 'border-red-500 bg-red-500/15 text-[var(--text)]'
                    : 'border-[var(--border)] text-[var(--text)] enabled:hover:border-gold enabled:hover:bg-[var(--surface)]'
              } ${answered && !isRight && !isWrong ? 'opacity-60' : ''}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-xs font-semibold">
                {isRight ? <Check size={16} aria-hidden /> : isWrong ? <X size={16} aria-hidden /> : LETTERS[i]}
              </span>
              <span>{opt}</span>
              {isRight && <span className="sr-only"> (respuesta correcta)</span>}
              {isWrong && <span className="sr-only"> (tu respuesta, incorrecta)</span>}
            </motion.button>
          )
        })}
      </div>

      <div aria-live="polite" className="min-h-[1px]">
        {answered && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-5 rounded-xl border-l-4 p-4 ${correct ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'}`}
          >
            <p className="font-semibold text-[var(--text)]">{correct ? '¡Correcto!' : 'Casi. La respuesta correcta está marcada en verde.'}</p>
            {q.explanation && <p className="mt-1 text-[var(--text-muted)]">{q.explanation}</p>}
          </motion.div>
        )}
      </div>

      {answered && (
        <button
          ref={nextRef}
          type="button"
          onClick={next}
          className="mt-5 rounded-full bg-[#f5b942] px-6 py-3 font-semibold text-[#071426] active:scale-95"
        >
          {index + 1 >= questions.length ? 'Ver resultado' : 'Siguiente pregunta'}
        </button>
      )}
    </div>
  )
}
