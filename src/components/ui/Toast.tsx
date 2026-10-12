import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type Kind = 'ok' | 'error' | 'info'
interface Item {
  id: number
  kind: Kind
  msg: string
}

const Ctx = createContext<(kind: Kind, msg: string) => void>(() => undefined)
export const useToast = () => useContext(Ctx)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const close = useCallback((id: number) => setItems((i) => i.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (kind: Kind, msg: string) => {
      const id = ++counter
      setItems((i) => [...i.slice(-3), { id, kind, msg }])
      window.setTimeout(() => close(id), kind === 'error' ? 8000 : 4500)
    },
    [close],
  )

  const icon = { ok: CheckCircle2, error: XCircle, info: Info }
  const tone = {
    ok: 'border-emerald-500/60 text-emerald-400',
    error: 'border-red-500/60 text-red-400',
    info: 'border-sky-500/60 text-sky-300',
  }

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[300] flex w-[min(92vw,440px)] -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = icon[t.kind]
            return (
              <motion.div
                key={t.id}
                layout
                role={t.kind === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-[var(--toast-bg)] p-3.5 text-sm text-slate-100 shadow-xl ${tone[t.kind]}`}
              >
                <Icon size={20} aria-hidden className="mt-0.5 shrink-0" />
                <p className="flex-1 text-slate-100">{t.msg}</p>
                <button type="button" onClick={() => close(t.id)} aria-label="Cerrar aviso" className="text-slate-400 hover:text-white">
                  <X size={16} aria-hidden />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
