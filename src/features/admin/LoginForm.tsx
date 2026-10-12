import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from '../../lib/zod'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button, Notice, TextField } from '../../components/ui/forms'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useToast } from '../../components/ui/Toast'
import { ARRIVED_ERROR } from '../../lib/authHash'
import { readFlag, removeFlag } from '../../lib/safeStorage'
import { supabase } from '../../lib/supabase'
import { IDLE_FLAG } from '../../hooks/useIdleLogout'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo.').email('El correo no parece válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-xl backdrop-blur sm:p-9">
        <div className="mb-6 text-center">
          <span aria-hidden className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f5b942] font-serif text-3xl font-semibold text-[#071426]">
            π
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-gold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-teal underline underline-offset-4">
            ← Volver al portafolio
          </Link>
        </p>
      </div>
    </main>
  )
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Si la sesión se cerró por inactividad, se avisa una sola vez.
  const [idle] = useState(() => {
    const was = readFlag(IDLE_FLAG) === '1'
    if (was) removeFlag(IDLE_FLAG)
    return was
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors
      setErrors({ email: f.email?.[0], password: f.password?.[0] })
      return
    }
    setErrors({})
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    setLoading(false)
    if (error) {
      setServerError(
        /invalid login/i.test(error.message)
          ? 'Correo o contraseña incorrectos.'
          : /email not confirmed/i.test(error.message)
            ? 'Tu correo aún no está confirmado. Abre el enlace de la invitación.'
            : 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.',
      )
    }
  }

  return (
    <Shell title="Espacio de editores">
      <form onSubmit={submit} noValidate className="space-y-4">
        {idle && <Notice tone="warn">Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.</Notice>}
        {ARRIVED_ERROR && <Notice tone="warn">{ARRIVED_ERROR}. Pide un enlace nuevo y ábrelo de nuevo.</Notice>}
        <TextField label="Correo electrónico" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" required />
        <div>
          <div className="relative">
            <TextField
              label="Contraseña"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-2 top-[30px] grid h-9 w-9 place-items-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-red-500">
            {serverError}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </Shell>
  )
}

const passwordSchema = z
  .object({
    password: z.string().min(10, 'Usa al menos 10 caracteres.').max(72, 'Máximo 72 caracteres.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Las contraseñas no coinciden.', path: ['confirm'] })

/** Crear contraseña (invitación o recuperación) o cambiarla. */
export function SetPasswordForm({
  mode,
  onDone,
}: {
  mode: 'invite' | 'recovery' | 'change'
  onDone: () => void
}) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ current?: string; password?: string; confirm?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const parsed = passwordSchema.safeParse({ password, confirm })
    const needsCurrent = mode === 'change'
    if (!parsed.success || (needsCurrent && !current)) {
      const f = parsed.success ? {} : parsed.error.flatten().fieldErrors
      setErrors({
        current: needsCurrent && !current ? 'Escribe tu contraseña actual.' : undefined,
        password: 'password' in f ? f.password?.[0] : undefined,
        confirm: 'confirm' in f ? f.confirm?.[0] : undefined,
      })
      return
    }
    if (needsCurrent && current === password) {
      setErrors({ password: 'La contraseña nueva debe ser distinta de la actual.' })
      return
    }
    setErrors({})
    setLoading(true)
    if (needsCurrent) {
      // Se comprueba la contraseña actual antes de permitir el cambio.
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email
      const check = email ? await supabase.auth.signInWithPassword({ email, password: current }) : { error: new Error('sin sesión') }
      if (check.error) {
        setLoading(false)
        setErrors({ current: 'La contraseña actual no es correcta.' })
        return
      }
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data!.password })
    setLoading(false)
    if (error) {
      setServerError(
        /same|different/i.test(error.message)
          ? 'La contraseña nueva debe ser distinta de la anterior.'
          : /weak|pwned|easy|guess/i.test(error.message)
            ? 'Esa contraseña es demasiado fácil de adivinar. Prueba con otra más larga.'
            : 'No se pudo guardar la contraseña. Inténtalo de nuevo.',
      )
      return
    }
    toast('ok', mode === 'change' ? 'Contraseña actualizada.' : '¡Listo! Ya puedes usar tu cuenta.')
    onDone()
  }

  const titles = {
    invite: ['¡Bienvenida o bienvenido!', 'Crea tu contraseña para entrar al Modo edición.'],
    recovery: ['Nueva contraseña', 'Escribe la contraseña nueva para tu cuenta.'],
    change: ['Cambiar contraseña', 'Elige una contraseña nueva para tu cuenta.'],
  } as const

  const form = (
    <form onSubmit={submit} noValidate className="space-y-4">
      {mode === 'change' && (
        <TextField label="Contraseña actual" type="password" value={current} onChange={setCurrent} error={errors.current} autoComplete="current-password" required />
      )}
      <TextField label="Contraseña nueva" type="password" value={password} onChange={setPassword} error={errors.password} hint="Mínimo 10 caracteres." autoComplete="new-password" required />
      <TextField label="Repite la contraseña" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" required />
      {serverError && (
        <p role="alert" className="text-sm text-red-500">
          {serverError}
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        <KeyRound size={16} aria-hidden /> Guardar contraseña
      </Button>
    </form>
  )

  if (mode === 'change') return form
  return (
    <Shell title={titles[mode][0]} subtitle={titles[mode][1]}>
      {form}
    </Shell>
  )
}
