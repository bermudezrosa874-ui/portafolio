import { lazy, Suspense, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/forms'
import { useRole, useSession } from '../../hooks/useAuth'
import { ARRIVED_TYPE } from '../../lib/authHash'
import { supabase } from '../../lib/supabase'
import { LoginForm, SetPasswordForm } from './LoginForm'

const MemberHome = lazy(() => import('./MemberHome'))

const TABS = [
  { id: 'general', label: 'Datos generales', Panel: lazy(() => import('./tabs/GeneralTab')) },
  { id: 'fases', label: 'Fases y entregas', Panel: lazy(() => import('./tabs/PhasesTab')) },
  { id: 'recursos', label: 'Línea de tiempo y recursos', Panel: lazy(() => import('./tabs/ResourcesTab')) },
  { id: 'videos', label: 'Videos', Panel: lazy(() => import('./tabs/VideosTab')) },
  { id: 'galeria', label: 'Galería', Panel: lazy(() => import('./tabs/GalleryTab')) },
  { id: 'bitacora', label: 'Bitácora', Panel: lazy(() => import('./tabs/JournalTab')) },
  { id: 'equipo', label: 'Equipo', Panel: lazy(() => import('./tabs/TeamTab')) },
  { id: 'quiz', label: 'Quiz', Panel: lazy(() => import('./tabs/QuizTab')) },
  { id: 'referencias', label: 'Referencias', Panel: lazy(() => import('./tabs/ReferencesTab')) },
] as const

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
  const { userName } = useRole()
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('general')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const current = TABS.find((t) => t.id === active) ?? TABS[0]

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = TABS.length - 1
    const to = e.key === 'ArrowRight' ? (index + 1) % TABS.length : e.key === 'ArrowLeft' ? (index - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (to === null) return
    e.preventDefault()
    setActive(TABS[to].id)
    tabRefs.current[to]?.focus()
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-semibold text-gold">Panel de administración</h1>
            <p className="break-all text-sm text-[var(--text-muted)]">{userName}</p>
          </div>
          <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]">
            <ExternalLink size={15} aria-hidden /> Ver portafolio
          </Link>
          <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
            <LogOut size={16} aria-hidden /> Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div role="tablist" aria-label="Secciones del panel" className="-mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {TABS.map((t, i) => {
            const on = t.id === active
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                  on ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} tabIndex={0}>
          <Suspense fallback={<p className="py-10 text-center text-[var(--text-muted)]">Cargando…</p>}>
            <current.Panel />
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

  if (isAdmin) return <AdminShell />
  if (role === 'member') {
    return (
      <Suspense fallback={<Loading />}>
        <MemberHome />
      </Suspense>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <ShieldAlert className="mx-auto text-[#f5b942]" size={44} aria-hidden />
        <h1 className="font-serif text-3xl font-semibold text-gold">Tu cuenta no tiene permisos</h1>
        <p className="text-[var(--text-muted)]">Pide a la administradora que registre tu correo en el panel y vuelve a entrar.</p>
        <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
