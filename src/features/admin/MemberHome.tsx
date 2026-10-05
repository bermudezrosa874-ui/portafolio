import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, KeyRound, LogOut } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Button, Card, Notice } from '../../components/ui/forms'
import { useRole } from '../../hooks/useAuth'
import { useMembers } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { SetPasswordForm } from './LoginForm'

const GalleryTab = lazy(() => import('./tabs/GalleryTab'))

/** Espacio de un integrante (no administrador): sus reflexiones, sus evidencias y su contraseña. */
export default function MemberHome() {
  const { session, userName } = useRole()
  const { data: members = [] } = useMembers()
  const [changing, setChanging] = useState(false)
  const me = members.find((m) => m.user_id === session?.user.id)
  const name = me?.name.replace(/\[[^\]]*\]/g, '').trim()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center gap-4">
        {me && <Avatar name={me.name} photoPath={me.photo_path} size={64} />}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-4xl font-semibold text-gold">Hola{name ? `, ${name.split(' ')[0]}` : ''}</h1>
          <p className="break-all text-sm text-[var(--text-muted)]">
            {userName}
            {me && ` · Tema: ${me.topic}`}
          </p>
        </div>
        <Link to="/" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]">
          Ver portafolio
        </Link>
        <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
          <LogOut size={16} aria-hidden /> Cerrar sesión
        </Button>
      </header>

      {!me && <Notice tone="warn">Tu cuenta todavía no está enlazada con una ficha de integrante. Avisa a la administradora para que registre tu correo.</Notice>}

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--text)]">
          <BookOpenCheck size={22} aria-hidden className="text-teal" /> Mis reflexiones
        </h2>
        <p className="text-[var(--text-muted)]">Escribe qué aprendiste, qué se te dificultó, qué te sorprendió y qué te gustaría aprender en cada fase. Solo puedes editar las tuyas.</p>
        <Link to="/#bitacora" className="inline-block rounded-full bg-[#f5b942] px-5 py-2.5 text-sm font-semibold text-[#071426]" onClick={() => setTimeout(() => document.getElementById('bitacora')?.scrollIntoView(), 100)}>
          Ir a la Bitácora
        </Link>
      </Card>

      <Suspense fallback={<p className="text-[var(--text-muted)]">Cargando…</p>}>
        <GalleryTab memberMode />
      </Suspense>

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--text)]">
          <KeyRound size={22} aria-hidden className="text-teal" /> Mi cuenta
        </h2>
        {changing ? (
          <SetPasswordForm mode="change" onDone={() => setChanging(false)} />
        ) : (
          <Button variant="secondary" onClick={() => setChanging(true)}>
            Cambiar mi contraseña
          </Button>
        )}
      </Card>
    </main>
  )
}
