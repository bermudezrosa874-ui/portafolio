import { Link } from 'react-router-dom'
import { RotateCcw, Pencil } from 'lucide-react'
import { useSiteConfig } from '../../lib/queries'

export function Footer({ onReplayIntro }: { onReplayIntro: () => void }) {
  const { data: cfg } = useSiteConfig()
  if (!cfg) return null

  return (
    <footer className="border-t border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)] sm:px-6">
      <p className="font-serif text-2xl font-semibold text-gold">{cfg.title}</p>
      <p className="mt-1">{cfg.university}</p>
      <p>
        {cfg.course} · {cfg.period}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={onReplayIntro}
          className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-gold hover:underline"
        >
          <RotateCcw size={14} aria-hidden /> Ver intro de nuevo
        </button>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 opacity-70 underline-offset-4 hover:text-gold hover:underline hover:opacity-100"
        >
          <Pencil size={14} aria-hidden /> Modo edición
        </Link>
      </div>
    </footer>
  )
}
