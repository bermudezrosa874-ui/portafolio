import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

/** Botón claro/oscuro. Comparte el estado con el resto de botones de tema de la aplicación. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className={`inline-grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--icon-btn)] text-[var(--text)] transition-colors hover:bg-[var(--hover)] ${className}`}
    >
      {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  )
}
