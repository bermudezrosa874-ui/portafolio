import { Avatar } from '../../components/Avatar'
import { firstName, memberColor, inkOf, readableOn, tintOf } from '../../lib/members'
import type { Member } from '../../types'

/** Insignia con el símbolo matemático favorito. Si la persona no puso ninguno, no se dibuja nada. */
export function SymbolBadge({ symbol, color, size = 28, className = '' }: { symbol: string; color: string; size?: number; className?: string }) {
  if (!symbol) return null
  return (
    <span
      title={`Símbolo favorito: ${symbol}`}
      className={`grid shrink-0 place-items-center rounded-full font-serif font-bold leading-none shadow-md ${className}`}
      style={{ width: size, height: size, minWidth: size, background: color, color: readableOn(color), fontSize: size * (symbol.length > 1 ? 0.42 : 0.62), border: '2px solid var(--card)' }}
    >
      <span aria-hidden>{symbol}</span>
      <span className="sr-only">Símbolo favorito: {symbol}</span>
    </span>
  )
}

/** Avatar circular con el color de la persona (foto, o sus iniciales sobre su color). */
export function MemberAvatar({ member, size = 64, badge = false }: { member: Member; size?: number; badge?: boolean }) {
  const color = memberColor(member)
  return (
    <span className="relative inline-block shrink-0 rounded-full" style={{ width: size, height: size, boxShadow: `0 0 0 3px ${tintOf(color, 55)}` }}>
      <Avatar name={member.name} photoPath={member.photo_path} size={size} color={color} />
      {badge && <SymbolBadge symbol={member.symbol} color={color} size={Math.max(20, Math.round(size * 0.34))} className="absolute -bottom-1 -right-1" />}
    </span>
  )
}

/** Barra de progreso con el color de la persona. */
export function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/** Versión mini de la tarjeta de integrante (selector de la Bitácora): avatar, nombre, símbolo y progreso. */
export function MemberMini({ member, done, total, active, onClick }: { member: Member; done: number; total: number; active: boolean; onClick: () => void }) {
  const color = memberColor(member)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all hover:-translate-y-0.5 sm:w-auto sm:shrink"
      style={{
        borderColor: active ? color : 'var(--border)',
        background: active ? tintOf(color, 16) : 'var(--surface)',
        boxShadow: active ? `0 0 0 1px ${color}` : undefined,
        borderTop: `3px solid ${color}`,
      }}
    >
      <MemberAvatar member={member} size={56} badge />
      <span className="font-serif text-lg font-semibold leading-tight text-[var(--text)]">{firstName(member.name)}</span>
      <span className="w-full space-y-1">
        <Bar value={done} max={total} color={color} label={`Fases completadas de ${firstName(member.name)}`} />
        <span className="block text-xs tabular-nums" style={{ color: inkOf(color) }}>
          {done}/{total} fases completadas
        </span>
      </span>
    </button>
  )
}
