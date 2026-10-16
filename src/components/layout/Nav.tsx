import type { MouseEvent } from 'react'
import { BookOpen, Clapperboard, FolderHeart, GraduationCap, History, Home, Image, Info, LayoutDashboard, Library, LogIn, Map, Puzzle, Users, type LucideIcon } from 'lucide-react'
import { SECTIONS, scrollToSection } from '../../lib/sections'
import { panelPath, useRole } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Sidebar, type SidebarItem } from './Sidebar'

const ICONS: Record<string, LucideIcon> = {
  inicio: Home,
  sobre: Info,
  recorrido: Map,
  aprendizajes: GraduationCap,
  'linea-de-tiempo': History,
  entrevistas: Clapperboard,
  recursos: Puzzle,
  aportes: FolderHeart,
  galeria: Image,
  bitacora: BookOpen,
  equipo: Users,
  referencias: Library,
}

/** Navegación del portafolio: sidebar a la izquierda. */
export function Nav({ active }: { active: string }) {
  const { session, role } = useRole()

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault()
    scrollToSection(id)
  }

  const items: SidebarItem[] = [
    ...SECTIONS.map((s) => ({
      id: s.id,
      label: s.label,
      icon: ICONS[s.id] ?? Home,
      href: `#${s.id}`,
      active: active === s.id,
      onSelect: (e: MouseEvent) => go(e, s.id),
    })),
    { id: 'cuenta', label: session ? 'Mi panel' : 'Iniciar sesión', icon: session ? LayoutDashboard : LogIn, to: panelPath(role), separator: true },
  ]

  return (
    <>
      <Sidebar
        label="Principal"
        items={items}
        brand={
          <a href="#inicio" onClick={(e) => go(e, 'inicio')} aria-label="Ábaco del Tiempo, ir al inicio" className="flex items-center gap-2 font-serif text-xl font-semibold text-gold">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-[#f5b942] text-base text-abyss">
              π
            </span>
            <span className="hidden md:inline">Ábaco del Tiempo</span>
          </a>
        }
        footer={
          <>
            <span className="hidden text-xs text-[var(--text-muted)] md:inline">Tema</span>
            <ThemeToggle />
          </>
        }
      />
    </>
  )
}
