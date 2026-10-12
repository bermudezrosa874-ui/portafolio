import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

interface Props<T extends { id: string }> {
  items: T[]
  render: (item: T, index: number) => ReactNode
  onReorder: (orderedIds: string[]) => void
  /** Nombre del elemento para los avisos del lector de pantalla. */
  nameOf: (item: T) => string
}

/**
 * Lista reordenable: arrastrar y soltar (escritorio) y botones subir/bajar (teclado y celular).
 * El orden definitivo lo guarda quien la usa mediante onReorder.
 */
export function SortableList<T extends { id: string }>({ items, render, onReorder, nameOf }: Props<T>) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onReorder(next.map((i) => i.id))
    setAnnounce(`${nameOf(it)} movido a la posición ${to + 1} de ${items.length}.`)
  }

  const btn =
    'grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)] disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => {
              setDragId(item.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setOverId(item.id)
            }}
            onDragEnd={() => {
              setDragId(null)
              setOverId(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              const from = items.findIndex((x) => x.id === dragId)
              if (from !== -1) move(from, i)
              setDragId(null)
              setOverId(null)
            }}
            className={`flex gap-3 rounded-2xl border bg-[var(--surface)] p-3 transition-colors ${
              overId === item.id && dragId !== item.id ? 'border-gold' : 'border-[var(--border)]'
            } ${dragId === item.id ? 'opacity-50' : ''}`}
          >
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <span aria-hidden className="cursor-grab text-[var(--text-muted)]">
                <GripVertical size={20} />
              </span>
              <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir: ${nameOf(item)}`}>
                <ArrowUp size={16} aria-hidden />
              </button>
              <button
                type="button"
                className={btn}
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Bajar: ${nameOf(item)}`}
              >
                <ArrowDown size={16} aria-hidden />
              </button>
            </div>
            <div className="min-w-0 flex-1">{render(item, i)}</div>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </>
  )
}
