import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, Shuffle, ShieldCheck, UserPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '../../../components/Avatar'
import { Card, Notice, TabIntro, TextField } from '../../../components/ui/forms'
import { useConfirm } from '../../../components/ui/Confirm'
import { useToast } from '../../../components/ui/Toast'
import { useMembers } from '../../../lib/queries'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/forms'
import { MAX_ACCOUNTS, createAccount, deleteAccount, setRole, useAccounts, useProfiles } from '../../contributions/api'
import { ROLE_LABEL, type AppRole } from '../../contributions/model'
import { friendlyError } from '../adminData'

const randomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(14))
  return Array.from(bytes, (n) => chars[n % chars.length]).join('')
}

/** Roles del equipo. Rosa (admin) no se puede degradar desde aquí ni desde la API: la base lo impide. */
export default function CollaboratorsTab() {
  const toast = useToast()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const { data: members = [] } = useMembers()
  const { data: profiles = [] } = useProfiles()
  const { data: accounts = [] } = useAccounts()

  // Crear la cuenta de un compañero (correo cualquiera + contraseña)
  const [openId, setOpenId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const full = accounts.length >= MAX_ACCOUNTS

  const openForm = (id: string) => {
    setOpenId(id)
    setEmail('')
    setPassword(randomPassword())
    setShow(true)
    setErrors({})
    setCreated(null)
  }

  const submit = async (memberId: string, name: string) => {
    const next: typeof errors = {}
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = 'Escribe un correo con el formato nombre@dominio.com'
    if (password.length < 10) next.password = 'Usa al menos 10 caracteres.'
    setErrors(next)
    if (next.email || next.password) return
    setBusy(true)
    try {
      await createAccount(memberId, email.trim(), password)
      await Promise.all(['accounts', 'profiles', 'members'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
      setCreated({ name, email: email.trim().toLowerCase(), password })
      setOpenId(null)
      setCopied(false)
      toast('ok', 'Cuenta creada.')
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(`Correo: ${created.email}\nContraseña: ${created.password}`)
      setCopied(true)
    } catch {
      toast('error', 'No se pudo copiar. Anótalos a mano.')
    }
  }

  const remove = async (userId: string, email: string) => {
    const yes = await confirm({
      title: 'Eliminar cuenta',
      message: `¿Eliminar la cuenta de ${email}? Dejará de poder entrar, su correo ya no estará autorizado y se libera un cupo. Sus aportes se conservan con su nombre. Esto no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      danger: true,
    })
    if (!yes) return
    try {
      await deleteAccount(userId)
      await Promise.all(['accounts', 'profiles', 'members', 'contributions'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
      toast('ok', 'Cuenta eliminada.')
    } catch (e) {
      toast('error', friendlyError(e))
    }
  }
  const roleOf = (uid: string | null): AppRole | null => (uid ? (profiles.find((p) => p.user_id === uid)?.role ?? null) : null)

  const change = async (userId: string, name: string, role: Exclude<AppRole, 'admin'>) => {
    const yes = await confirm({
      title: 'Cambiar rol',
      message: `${name} pasará a ser ${ROLE_LABEL[role].toLowerCase()}.${role === 'user' ? ' Dejará de poder subir aportes.' : ''}`,
      confirmLabel: 'Cambiar',
    })
    if (!yes) return
    try {
      await setRole(userId, role)
      await qc.invalidateQueries({ queryKey: ['profiles'] })
      toast('ok', 'Rol actualizado.')
    } catch (e) {
      toast('error', friendlyError(e))
    }
  }

  return (
    <div className="space-y-6">
      <TabIntro title="Colaboradores y roles">
        Rosa es la administradora. Los demás integrantes son colaboradores: suben sus aportes y solo pueden gestionar los suyos. Cuando una persona cree su cuenta con el correo que registraste en «Equipo», se vuelve colaboradora automáticamente.
      </TabIntro>
      {created && (
        <Card className="space-y-2 border-teal/40">
          <p className="font-semibold text-[var(--text)]">Cuenta de {created.name} lista</p>
          <p className="break-all text-sm text-[var(--text)]">
            Correo: <strong>{created.email}</strong>
            <br />
            Contraseña: <strong>{created.password}</strong>
          </p>
          <p className="text-xs text-[var(--text-muted)]">Entrégale estos datos. La contraseña no se vuelve a mostrar; si la pierde, se elimina la cuenta y se crea otra.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void copy()}>
              {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? 'Copiado' : 'Copiar datos'}
            </Button>
            <Button variant="ghost" onClick={() => setCreated(null)}>
              Ocultar
            </Button>
          </div>
        </Card>
      )}
      <ul className="space-y-3">
        {members.map((m) => {
          const role = roleOf(m.user_id)
          const name = m.name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante'
          return (
            <li key={m.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <Avatar name={m.name} photoPath={m.photo_path} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text)]">{name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{m.user_id ? 'Cuenta enlazada' : 'Sin cuenta todavía'}</p>
                </div>
                {role === 'admin' ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-400/25 px-4 py-1.5 text-sm font-semibold text-[var(--text)]">
                    <ShieldCheck size={16} aria-hidden /> {ROLE_LABEL.admin} (Rosa)
                  </span>
                ) : m.user_id ? (
                  <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                    Rol
                    <select
                      value={role ?? 'user'}
                      onChange={(e) => void change(m.user_id!, name, e.target.value as Exclude<AppRole, 'admin'>)}
                      className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--text)]"
                    >
                      <option value="user">{ROLE_LABEL.user}</option>
                      <option value="collaborator">{ROLE_LABEL.collaborator}</option>
                    </select>
                  </label>
                ) : (
                  <Button variant="secondary" disabled={full} title={full ? 'No quedan cupos (máximo 6 cuentas)' : undefined} onClick={() => openForm(m.id)}>
                    <UserPlus size={15} aria-hidden /> Crear cuenta
                  </Button>
                )}
                {openId === m.id && (
                  <div className="basis-full space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <Notice>Pon el correo que quieras (no hace falta que exista) y una contraseña. La cuenta queda lista para entrar, sin confirmar nada.</Notice>
                    <TextField label="Correo de la cuenta" type="email" value={email} onChange={setEmail} error={errors.email} required autoComplete="off" />
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <TextField label="Contraseña" type={show ? 'text' : 'password'} value={password} onChange={setPassword} error={errors.password} required autoComplete="new-password" hint="Mínimo 10 caracteres." />
                      </div>
                      <Button variant="secondary" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow((s) => !s)}>
                        {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                      </Button>
                      <Button variant="secondary" onClick={() => setPassword(randomPassword())}>
                        <Shuffle size={15} aria-hidden /> Generar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button loading={busy} onClick={() => void submit(m.id, name)}>
                        <UserPlus size={15} aria-hidden /> Crear cuenta
                      </Button>
                      <Button variant="ghost" disabled={busy} onClick={() => setOpenId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      <section aria-labelledby="cuentas" className="space-y-3">
        <h3 id="cuentas" className="font-serif text-2xl font-semibold text-[var(--text)]">
          Cuentas ({accounts.length} de {MAX_ACCOUNTS})
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          {accounts.length >= MAX_ACCOUNTS ? 'No quedan cupos.' : `Quedan ${MAX_ACCOUNTS - accounts.length} cupos.`} Tú decides si eliminas una cuenta; si no, se queda como está.
        </p>
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.user_id}>
              <Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold text-[var(--text)]">{a.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {a.role ? ROLE_LABEL[a.role] : 'Sin rol'} · {a.member_name ?? 'Sin ficha de integrante (cuenta de prueba)'}
                  </p>
                </div>
                {a.role !== 'admin' && (
                  <Button variant="danger" onClick={() => void remove(a.user_id, a.email)}>
                    <Trash2 size={15} aria-hidden /> Eliminar cuenta
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
