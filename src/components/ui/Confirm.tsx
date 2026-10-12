import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface Options {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}
type Ask = (o: Options) => Promise<boolean>

const Ctx = createContext<Ask>(async () => false)
/** Devuelve una función que pregunta y resuelve true/false. Úsala antes de eliminar cualquier cosa. */
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: Options; resolve: (v: boolean) => void } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, !!state)

  const ask = useCallback<Ask>((opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })), [])
  const answer = useCallback(
    (v: boolean) => {
      state?.resolve(v)
      setState(null)
    },
    [state],
  )

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && answer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, answer])

  return (
    <Ctx.Provider value={ask}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state && (
            <motion.div
              className="fixed inset-0 z-[250] grid place-items-center bg-black/70 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => answer(false)}
            >
              <motion.div
                ref={ref}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-titulo"
                aria-describedby="confirm-texto"
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-white/15 bg-[var(--toast-bg)] p-6 text-slate-100 shadow-2xl"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={state.opts.danger ? 'text-red-400' : 'text-[#f5b942]'} aria-hidden />
                  <div>
                    <h2 id="confirm-titulo" className="font-serif text-2xl font-semibold text-slate-50">
                      {state.opts.title}
                    </h2>
                    <p id="confirm-texto" className="mt-1.5 text-slate-300">
                      {state.opts.message}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="rounded-full border border-white/20 px-5 py-2.5 text-slate-100 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(true)}
                    className={`rounded-full px-5 py-2.5 font-semibold ${
                      state.opts.danger ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-[#f5b942] text-[#071426]'
                    }`}
                  >
                    {state.opts.confirmLabel ?? 'Confirmar'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Ctx.Provider>
  )
}
