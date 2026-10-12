import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import type { LucideIcon } from 'lucide-react'

export interface SidebarItem {
  id: string
  label: string
  icon: LucideIcon
  active?: boolean
  danger?: boolean
  /** Número pequeño (por ejemplo, avisos sin leer). */
  badge?: number
  /** Línea separadora antes de esta opción. */
  separator?: boolean
  /** Enlace interno de la aplicación. */
  to?: string
  /** Ancla dentro de la misma página (se combina con onSelect). */
  href?: string
  onSelect?: (e: MouseEvent) => void
}

/** Relleno que debe llevar el contenido para no quedar debajo del sidebar. */
export const SIDEBAR_PAD = 'pl-14 md:pl-60'

interface Props {
  /** Nombre accesible del menú de navegación. */
  label: string
  brand: ReactNode
  /** Texto bajo el nombre (por ejemplo, el correo); solo se ve cuando hay ancho. */
  subtitle?: string
  items: SidebarItem[]
  footer?: ReactNode
}

/**
 * Sidebar fijo a la izquierda. En pantallas anchas muestra íconos y nombres; en las angostas se queda en una
 * franja de íconos (con el nombre como ayuda), así nunca hace falta un botón de menú.
 */
export function Sidebar({ label, brand, subtitle, items, footer }: Props) {
  const row = (i: SidebarItem) =>
    `relative flex min-h-10 w-full items-center justify-center gap-3 rounded-xl px-2 text-left text-sm transition-colors md:justify-start md:px-3 ${
      i.active
        ? 'bg-[var(--menu-active)] font-semibold text-[var(--text)]'
        : i.danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]'
    }`

  const content = (i: SidebarItem) => (
    <>
      <i.icon size={19} aria-hidden className="shrink-0" />
      <span className="hidden flex-1 truncate md:inline">{i.label}</span>
      {!!i.badge && (
        <span
          aria-label={`${i.badge} nuevos`}
          className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-pink-400 px-1 text-[10px] font-bold text-[#071426] md:static md:min-w-5 md:px-1.5 md:text-xs"
        >
          {i.badge}
        </span>
      )}
    </>
  )

  return (
    <aside aria-label={label} className="fixed inset-y-0 left-0 z-50 flex w-14 flex-col border-r border-[var(--border)] bg-[var(--menu-bg)] md:w-60">
      <div className="flex min-h-16 flex-col items-center justify-center gap-0.5 border-b border-[var(--border)] px-2 py-2 md:items-start md:px-4">
        {brand}
        {subtitle && <span className="hidden min-w-0 break-all text-xs leading-tight text-[var(--text-muted)] md:block">{subtitle}</span>}
      </div>

      <nav aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        <ul className="space-y-px">
          {items.map((i) => (
            <li key={i.id} className={i.separator ? 'mt-2 border-t border-[var(--border)] pt-2' : undefined}>
              {i.to ? (
                <Link to={i.to} title={i.label} aria-label={i.label} className={row(i)} onClick={i.onSelect}>
                  {content(i)}
                </Link>
              ) : i.href ? (
                <a href={i.href} title={i.label} aria-label={i.label} aria-current={i.active ? 'location' : undefined} className={row(i)} onClick={i.onSelect}>
                  {content(i)}
                </a>
              ) : (
                <button type="button" title={i.label} aria-label={i.label} aria-current={i.active ? 'page' : undefined} className={row(i)} onClick={i.onSelect}>
                  {content(i)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {footer && <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] p-2 md:justify-between">{footer}</div>}
    </aside>
  )
}

/** Marca (π + título) para los sidebars de los paneles. */
export function PanelBrand({ title }: { title: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-[#f5b942] font-serif text-lg font-semibold text-abyss">
        π
      </span>
      <span className="hidden font-serif text-lg font-semibold text-gold md:inline">{title}</span>
    </span>
  )
}

/** Pie del sidebar con el botón claro/oscuro. */
export function ThemeFooter() {
  return (
    <>
      <span className="hidden text-xs text-[var(--text-muted)] md:inline">Tema</span>
      <ThemeToggle />
    </>
  )
}
