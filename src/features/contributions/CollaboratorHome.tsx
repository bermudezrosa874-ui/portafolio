import { lazy, Suspense, useState } from 'react'
import { BookOpenCheck, CheckCircle2, ClipboardList, Clapperboard, Puzzle, FolderHeart, Hourglass, Layers, PencilLine, Home, KeyRound, LogOut, PlusCircle, UserRound, Globe } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { EmptyState } from '../../components/EmptyState'
import { Button, Card, Notice } from '../../components/ui/forms'
import { PanelBrand, Sidebar, SIDEBAR_PAD, ThemeFooter, type SidebarItem } from '../../components/layout/Sidebar'
import { useRole } from '../../hooks/useAuth'
import { useMembers } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { SetPasswordForm } from '../admin/LoginForm'
import { useContributions, useLogLogin } from './api'
import { ContributionCard } from './ContributionCard'
import { ContributionForm } from './ContributionForm'
import { MyPhases } from './MyPhases'
import { PhasesBoard } from './PhasesBoard'
import { ROLE_LABEL, type Contribution } from './model'

const GalleryTab = lazy(() => import('../admin/tabs/GalleryTab'))
const ResourcesTab = lazy(() => import('../admin/tabs/ResourcesTab'))
const VideosTab = lazy(() => import('../admin/tabs/VideosTab'))

type View = 'inicio' | 'entregas' | 'fases' | 'recursos' | 'entrevistas' | 'aportes' | 'subir' | 'perfil'

const STAT_TONES = [
  'from-emerald-400/25 to-sky-400/20',
  'from-pink-400/25 to-violet-400/20',
  'from-sky-400/25 to-emerald-400/20',
]

/** Espacio de un colaborador: sus aportes, subir recursos y su perfil. Sin controles administrativos. */
export default function CollaboratorHome() {
  const { session, userName } = useRole()
  const userId = session?.user.id ?? ''
  useLogLogin(userId || undefined)
  const { data: members = [] } = useMembers()
  const { data: mine = [], isLoading } = useContributions({ mine: true, userId })
  // Los botones «Subir» de cada fase llegan aquí con un ancla (/admin#recursos, #entrevistas o #fases).
  const [view, setView] = useState<View>(() => {
    const h = window.location.hash.slice(1)
    return h === 'recursos' || h === 'entrevistas' || h === 'fases' || h === 'entregas' ? h : 'inicio'
  })
  const [editing, setEditing] = useState<Contribution | null>(null)
  const [changing, setChanging] = useState(false)

  const me = members.find((m) => m.user_id === userId)
  const name = me?.name.replace(/\[[^\]]*\]/g, '').trim()
  const count = (s: Contribution['status']) => mine.filter((c) => c.status === s).length

  const go = (v: View) => {
    setEditing(null)
    setView(v)
  }

  const items: SidebarItem[] = [
    { id: 'inicio', label: 'Inicio', icon: Home, active: !editing && view === 'inicio', onSelect: () => go('inicio') },
    { id: 'portafolio', label: 'Portafolio', icon: Globe, to: '/' },
    { id: 'entregas', label: 'Fases y entregas', icon: ClipboardList, active: !editing && view === 'entregas', onSelect: () => go('entregas') },
    { id: 'fases', label: 'Mis fases', icon: Layers, active: !editing && view === 'fases', onSelect: () => go('fases') },
    { id: 'recursos', label: 'Línea de tiempo y recursos', icon: Puzzle, active: !editing && view === 'recursos', onSelect: () => go('recursos') },
    { id: 'entrevistas', label: 'Entrevistas', icon: Clapperboard, active: !editing && view === 'entrevistas', onSelect: () => go('entrevistas') },
    { id: 'aportes', label: 'Mis aportes', icon: FolderHeart, active: !editing && view === 'aportes', onSelect: () => go('aportes') },
    { id: 'subir', label: 'Subir recurso', icon: PlusCircle, active: !editing && view === 'subir', onSelect: () => go('subir') },
    { id: 'perfil', label: 'Mi perfil', icon: UserRound, active: !editing && view === 'perfil', onSelect: () => go('perfil') },
    { id: 'salir', label: 'Cerrar sesión', icon: LogOut, danger: true, separator: true, onSelect: () => void supabase.auth.signOut().then(() => window.location.assign('/')) },
  ]

  const list = (items: Contribution[]) =>
    items.length === 0 ? (
      <EmptyState icon={FolderHeart} title="Todavía no has subido nada" text="Pulsa «Subir recurso» para compartir tu primer aporte." />
    ) : (
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <ContributionCard key={c.id} c={c} isAdmin={false} onEdit={(x) => setEditing(x)} />
        ))}
      </ul>
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400/10 via-transparent to-pink-400/10">
      <Sidebar label="Menú del colaborador" subtitle={userName ?? undefined} items={items} brand={<PanelBrand title="Colaborador" />} footer={<ThemeFooter />} />

      <main className={`mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 ${SIDEBAR_PAD}`}>
        <header className="flex flex-wrap items-center gap-4">
          {me && <Avatar name={me.name} photoPath={me.photo_path} size={56} />}
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-semibold text-gold">Hola{name ? `, ${name.split(' ')[0]}` : ''}</h1>
            <p className="break-all text-sm text-[var(--text-muted)]">
              {ROLE_LABEL.collaborator} · {userName}
            </p>
          </div>
        </header>
        {!me && <Notice tone="warn">Tu cuenta todavía no está enlazada con una ficha de integrante. Avisa a Rosa para que registre tu correo.</Notice>}

        {editing ? (
          <ContributionForm userId={userId} isAdmin={false} initial={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
        ) : view === 'inicio' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ['Publicados', count('published'), CheckCircle2],
                  ['En revisión', count('pending_review'), Hourglass],
                  ['Borradores', count('draft'), PencilLine],
                ] as const
              ).map(([label, n, Icon], i) => (
                <div key={label} data-tile={[3, 2, 1][i]} className={`lift rounded-2xl border border-[var(--border)] bg-gradient-to-br ${STAT_TONES[i]} p-5`}>
                  <p className="text-sm text-[var(--text-muted)]">
                    <Icon size={16} aria-hidden className="mr-1 inline align-[-3px]" /> {label}
                  </p>
                  <p className="mt-1 font-serif text-4xl font-semibold text-[var(--text)]">{n}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => go('subir')}>
                <PlusCircle size={16} aria-hidden /> Subir nuevo recurso
              </Button>
              <Button variant="secondary" onClick={() => go('fases')}>
                <BookOpenCheck size={16} aria-hidden /> Mis fases y reflexiones
              </Button>
            </div>
            <section aria-labelledby="recientes" className="space-y-3">
              <h2 id="recientes" className="font-serif text-2xl font-semibold text-[var(--text)]">
                Mis aportes recientes
              </h2>
              {isLoading ? <p className="text-[var(--text-muted)]">Cargando…</p> : list(mine.slice(0, 4))}
            </section>
            <Suspense fallback={<p className="text-[var(--text-muted)]">Cargando…</p>}>
              <GalleryTab memberMode />
            </Suspense>
          </>
        ) : view === 'entregas' ? (
          <PhasesBoard go={(t) => go(t)} />
        ) : view === 'fases' ? (
          <MyPhases userId={userId} isAdmin={false} />
        ) : view === 'recursos' ? (
          <Suspense fallback={<p className="text-[var(--text-muted)]">Cargando…</p>}>
            <ResourcesTab ownerId={userId} />
          </Suspense>
        ) : view === 'entrevistas' ? (
          <Suspense fallback={<p className="text-[var(--text-muted)]">Cargando…</p>}>
            <VideosTab ownerId={userId} />
          </Suspense>
        ) : view === 'aportes' ? (
          <section aria-labelledby="mis-aportes" className="space-y-3">
            <h2 id="mis-aportes" className="font-serif text-3xl font-semibold text-gold">
              Mis aportes
            </h2>
            <p className="text-sm text-[var(--text-muted)]">Aquí ves y administras únicamente lo que tú subiste. Rosa decide qué se publica en el portafolio.</p>
            {isLoading ? <p className="text-[var(--text-muted)]">Cargando…</p> : list(mine)}
          </section>
        ) : view === 'subir' ? (
          <ContributionForm userId={userId} isAdmin={false} onDone={() => go('aportes')} />
        ) : (
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--text)]">
              <UserRound size={22} aria-hidden className="text-teal" /> Mi perfil
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
              <dt className="text-[var(--text-muted)]">Nombre</dt>
              <dd className="text-[var(--text)]">{name || '—'}</dd>
              <dt className="text-[var(--text-muted)]">Correo</dt>
              <dd className="break-all text-[var(--text)]">{userName}</dd>
              <dt className="text-[var(--text-muted)]">Rol</dt>
              <dd className="text-[var(--text)]">{ROLE_LABEL.collaborator}</dd>
            </dl>
            <h3 className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <KeyRound size={18} aria-hidden className="text-teal" /> Contraseña
            </h3>
            {changing ? (
              <SetPasswordForm mode="change" onDone={() => setChanging(false)} />
            ) : (
              <Button variant="secondary" onClick={() => setChanging(true)}>
                Cambiar mi contraseña
              </Button>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
