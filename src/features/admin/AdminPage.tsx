import { lazy, Suspense, useState, type ComponentType } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  FolderHeart,
  Image,
  Clock,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../../components/ui/forms'
import { PanelBrand, Sidebar, SIDEBAR_PAD, ThemeFooter, type SidebarItem } from '../../components/layout/Sidebar'
import { useRole, useSession } from '../../hooks/useAuth'
import { ARRIVED_TYPE } from '../../lib/authHash'
import { supabase } from '../../lib/supabase'
import { useLogLogin, useNotifications } from '../contributions/api'
import { LoginForm, SetPasswordForm } from './LoginForm'
import type { TabGo } from './tabs/DashboardTab'

const CollaboratorHome = lazy(() => import('../contributions/CollaboratorHome'))

const TABS = [
  { id: 'resumen', label: 'Resumen', Panel: lazy(() => import('./tabs/DashboardTab')) },
  { id: 'mios', label: 'Mis fases y aportes', Panel: lazy(() => import('./tabs/MyContributionsTab')) },
  { id: 'perfil', label: 'Mi perfil', Panel: lazy(() => import('./tabs/MyProfileTab')) },
  { id: 'aportes', label: 'Archivos del equipo', Panel: lazy(() => import('./tabs/TeamFilesTab')) },
  { id: 'colaboradores', label: 'Colaboradores', Panel: lazy(() => import('./tabs/CollaboratorsTab')) },
  { id: 'general', label: 'Datos generales', Panel: lazy(() => import('./tabs/GeneralTab')) },
  { id: 'fases', label: 'Fases y entregas', Panel: lazy(() => import('./tabs/PhasesTab')) },
  { id: 'recursos', label: 'Línea de tiempo y recursos', Panel: lazy(() => import('./tabs/ResourcesTab')) },
  { id: 'videos', label: 'Videos', Panel: lazy(() => import('./tabs/VideosTab')) },
  { id: 'galeria', label: 'Galería', Panel: lazy(() => import('./tabs/GalleryTab')) },
  { id: 'bitacora', label: 'Bitácora', Panel: lazy(() => import('./tabs/JournalTab')) },
  { id: 'equipo', label: 'Equipo', Panel: lazy(() => import('./tabs/TeamTab')) },
  { id: 'referencias', label: 'Referencias', Panel: lazy(() => import('./tabs/ReferencesTab')) },
  { id: 'conexiones', label: 'Conexiones', Panel: lazy(() => import('./tabs/LoginsTab')) },
  { id: 'cuenta', label: 'Mi cuenta', Panel: lazy(() => import('./tabs/AccountTab')) },
] as const

type TabId = (typeof TABS)[number]['id']

const TAB_ICONS: Record<TabId, LucideIcon> = {
  resumen: LayoutDashboard,
  mios: FolderHeart,
  perfil: UserRound,
  aportes: FolderHeart,
  colaboradores: Users,
  general: Settings,
  fases: ClipboardList,
  recursos: Puzzle,
  videos: Video,
  galeria: Image,
  bitacora: BookOpen,
  equipo: Users,
  referencias: FileText,
  conexiones: Clock,
  cuenta: KeyRound,
}

// Si el visitante ya creó su contraseña en esta carga de la página, no se vuelve a pedir.
let passwordHandled = false

function Loading({ text = 'Cargando…' }: { text?: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <p className="text-[var(--text-muted)]" role="status">
        {text}
      </p>
    </main>
  )
}

function AdminShell() {
  const { userName, session } = useRole()
  useLogLogin(session?.user.id)
  const { data: notifications = [] } = useNotifications()
  const unread = notifications.filter((n) => !n.read).length
  // Los botones «Subir» de cada fase llegan aquí con un ancla (/admin#recursos, #entrevistas o #fases).
  const [active, setActive] = useState<TabId>(() => {
    const target: Record<string, TabId> = { recursos: 'recursos', entrevistas: 'videos', fases: 'mios', entregas: 'fases' }
    return target[window.location.hash.slice(1)] ?? 'resumen'
  })
  const current = TABS.find((t) => t.id === active) ?? TABS[0]
  // Algunas secciones (el resumen) pueden pedir que se abra otra.
  const Panel = current.Panel as ComponentType<{ go?: TabGo }>

  const items: SidebarItem[] = [
    ...TABS.map((t) => ({
      id: t.id,
      label: t.label,
      icon: TAB_ICONS[t.id],
      active: t.id === active,
      badge: t.id === 'resumen' ? unread : undefined,
      onSelect: () => setActive(t.id),
    })),
    { id: 'portafolio', label: 'Ver portafolio', icon: ExternalLink, to: '/', separator: true },
    { id: 'salir', label: 'Cerrar sesión', icon: LogOut, danger: true, onSelect: () => void supabase.auth.signOut().then(() => window.location.assign('/')) },
  ]

  return (
    <div className="min-h-screen">
      <Sidebar label="Menú del panel" subtitle={userName ?? undefined} items={items} brand={<PanelBrand title="Panel" />} footer={<ThemeFooter />} />

      <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 ${SIDEBAR_PAD}`}>
        <h1 className="font-serif text-3xl font-semibold text-gold">{current.label}</h1>
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-teal">Panel de administración</p>

        <div role="region" aria-label={current.label} tabIndex={0}>
          <Suspense fallback={<p className="py-10 text-center text-[var(--text-muted)]">Cargando…</p>}>
            <Panel go={setActive} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { session, ready } = useSession()
  const { role, roleLoading, isAdmin } = useRole()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const [, force] = useState(0)

  if (!ready || (session && roleLoading)) return <Loading />
  if (!session) return <LoginForm />

  if (ARRIVED_TYPE && !passwordHandled) {
    return (
      <SetPasswordForm
        mode={ARRIVED_TYPE === 'recovery' ? 'recovery' : 'invite'}
        onDone={() => {
          passwordHandled = true
          force((n) => n + 1)
          navigate('/admin', { replace: true })
        }}
      />
    )
  }

  // Cada quien ve la dirección de su panel: /admin para la administradora y /colaborador para los colaboradores.
  if (isAdmin && pathname !== '/admin') return <Navigate to={{ pathname: '/admin', hash }} replace />
  if (role === 'collaborator' && pathname !== '/colaborador') return <Navigate to={{ pathname: '/colaborador', hash }} replace />

  if (isAdmin) return <AdminShell />
  // Colaboradores: panel sencillo, sin ninguna herramienta administrativa. Las demás cuentas no entran.
  if (role === 'collaborator') {
    return (
      <Suspense fallback={<Loading />}>
        <CollaboratorHome />
      </Suspense>
    )
  }

  return (
    <main className={`grid min-h-screen place-items-center px-4 text-center ${SIDEBAR_PAD}`}>
      <Sidebar
        label="Menú de mi cuenta"
        brand={<PanelBrand title="Mi cuenta" />}
        footer={<ThemeFooter />}
        items={[
          { id: 'portafolio', label: 'Ver portafolio', icon: ExternalLink, to: '/' },
          { id: 'salir', label: 'Cerrar sesión', icon: LogOut, danger: true, separator: true, onSelect: () => void supabase.auth.signOut().then(() => window.location.assign('/')) },
        ]}
      />
      <div className="max-w-md space-y-4">
        <ShieldAlert className="mx-auto text-[#f5b942]" size={44} aria-hidden />
        <h1 className="font-serif text-3xl font-semibold text-gold">Tu cuenta no tiene permisos</h1>
        <p className="text-[var(--text-muted)]">Pide a la administradora que registre tu correo en el panel y vuelve a entrar.</p>
        <Button variant="secondary" onClick={() => void supabase.auth.signOut().then(() => window.location.assign('/'))}>
          Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
