import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  text,
  dark = false,
}: {
  icon: LucideIcon
  title: string
  text?: string
  dark?: boolean
}) {
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed p-10 text-center ${
        dark ? 'border-[var(--viewer-line)] text-[var(--viewer-muted)]' : 'border-[var(--border)] text-[var(--text-muted)]'
      }`}
    >
      <Icon size={36} aria-hidden className="opacity-70" />
      <p className={`mt-3 font-serif text-xl font-semibold ${dark ? 'text-[var(--viewer-text)]' : 'text-[var(--text)]'}`}>{title}</p>
      {text && <p className="mt-1 text-sm">{text}</p>}
    </div>
  )
}
