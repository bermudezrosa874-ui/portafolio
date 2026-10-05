import { useState } from 'react'
import { Pencil, Trash2, UserCheck } from 'lucide-react'
import { z } from '../../../lib/zod'
import { Avatar } from '../../../components/Avatar'
import { Button, Card, Notice, SelectField, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { Dropzone } from '../../../components/ui/Dropzone'
import { SortableList } from '../../../components/ui/SortableList'
import { useConfirm } from '../../../components/ui/Confirm'
import { validateImage } from '../../../lib/fileValidation'
import { processSingle } from '../../../lib/image'
import { deleteRow, dropFile, insertRow, persistOrder, updateRow, uploadImage, useAction, useAdminRows, useRefresh } from '../adminData'
import type { Member } from '../../../types'

interface MemberEmail {
  email: string
  member_id: string
  grant_admin: boolean
}

function MemberEditor({ member, onClose }: { member: Member; onClose: () => void }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [f, setF] = useState({ name: member.name, program: member.program, topic: member.topic, role: member.role, contribution: member.contribution, photo_path: member.photo_path })
  const [progress, setProgress] = useState<number | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  const onPhoto = async (files: File[]) => {
    setPhotoError(null)
    const check = await validateImage(files[0])
    if (!check.ok) return setPhotoError(check.error)
    try {
      setProgress(0)
      const img = await processSingle(files[0], 640)
      const path = await uploadImage('members', '', img, setProgress)
      if (f.photo_path && f.photo_path !== member.photo_path) await dropFile('members', f.photo_path)
      setF((s) => ({ ...s, photo_path: path }))
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'No se pudo subir la foto.')
    } finally {
      setProgress(null)
    }
  }

  const save = async () => {
    setTouched(true)
    if (!f.name.trim() || !f.topic.trim()) return
    const ok = await run('Integrante guardado.', async () => {
      await updateRow('members', member.id, {
        name: f.name.trim(),
        program: f.program.trim(),
        topic: f.topic.trim(),
        role: f.role.trim(),
        contribution: f.contribution,
        photo_path: f.photo_path,
      })
      if (member.photo_path && member.photo_path !== f.photo_path) await dropFile('members', member.photo_path)
      await refresh('members')
      return true
    })
    if (ok) onClose()
  }

  return (
    <Card className="space-y-4 border-gold/40">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">Editar integrante</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nombre completo" value={f.name} onChange={set('name')} required maxLength={120} error={touched && !f.name.trim() ? 'El nombre es obligatorio.' : undefined} />
        <TextField label="Tema asignado" value={f.topic} onChange={set('topic')} required maxLength={120} error={touched && !f.topic.trim() ? 'El tema es obligatorio.' : undefined} />
        <TextField label="Programa" value={f.program} onChange={set('program')} maxLength={160} />
        <TextField label="Rol en el proyecto" value={f.role} onChange={set('role')} maxLength={200} hint="Por ejemplo: Investigación · Diseño digital · Desarrollo del portafolio" />
      </div>
      <TextArea label="Aporte principal al proyecto (reverso de la tarjeta)" value={f.contribution} onChange={set('contribution')} rows={4} maxLength={1000} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--text)]">Foto</p>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={f.name} photoPath={f.photo_path} size={72} />
          {f.photo_path && (
            <Button variant="secondary" onClick={() => setF((s) => ({ ...s, photo_path: null }))}>
              Quitar foto
            </Button>
          )}
        </div>
        <Dropzone accept="image/jpeg,image/png,image/webp" onFiles={onPhoto} label="Arrastra una foto o elígela" hint="JPG, PNG o WebP · máx. 8 MB · se ajusta sola" disabled={progress !== null} />
        {progress !== null && <p role="status" className="text-sm text-[var(--text-muted)]">Subiendo foto… {Math.round(progress * 100)} %</p>}
        {photoError && <p role="alert" className="text-sm text-red-500">{photoError}</p>}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-4">
        <Button loading={busy} disabled={progress !== null} onClick={save}>
          {progress !== null ? 'Subiendo foto…' : 'Guardar integrante'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}

const emailSchema = z.string().trim().toLowerCase().email('El correo no parece válido.')

function EmailsSection({ members }: { members: Member[] }) {
  const { data: emails = [] } = useAdminRows<MemberEmail>('member_emails', [['created_at', true]])
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [email, setEmail] = useState('')
  const [memberId, setMemberId] = useState(members[0]?.id ?? '')
  const [admin, setAdmin] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const add = async () => {
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    if (!memberId) return setError('Elige a qué integrante pertenece.')
    setError(undefined)
    const ok = await run('Correo registrado.', async () => {
      await insertRow('member_emails', { email: parsed.data, member_id: memberId, grant_admin: admin })
      await refresh('member_emails')
      await refresh('members')
      return true
    })
    if (ok) {
      setEmail('')
      setAdmin(false)
    }
  }

  const remove = async (e: MemberEmail) => {
    const ok = await confirm({
      title: '¿Quitar este correo?',
      message: `Se quitará ${e.email} de la lista. Esto NO borra su cuenta ni le quita el acceso: para eso usa el panel de Supabase (Authentication → Users).`,
      confirmLabel: 'Quitar correo',
      danger: true,
    })
    if (!ok) return
    await run('Correo quitado.', async () => {
      await deleteRow('member_emails', e.email, 'email')
      await refresh('member_emails')
    })
  }

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante'

  return (
    <section aria-labelledby="correos-titulo" className="space-y-4">
      <h3 id="correos-titulo" className="font-serif text-2xl font-semibold text-[var(--text)]">
        Cuentas de integrantes
      </h3>
      <Notice>
        <strong>Cómo invitar a un integrante:</strong> 1) escribe aquí su correo y elige su ficha; 2) en Supabase entra a <em>Authentication → Users → Invite user</em> y escribe el mismo correo; 3) la persona abre el enlace del correo y crea su contraseña. Su cuenta queda enlazada sola con su ficha.
      </Notice>
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Correo del integrante" type="email" value={email} onChange={setEmail} error={error} autoComplete="off" />
          <SelectField label="Ficha del integrante" value={memberId} onChange={setMemberId} options={members.map((m) => ({ value: m.id, label: `${nameOf(m.id)} · ${m.topic}` }))} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle checked={admin} onChange={setAdmin} labelOn="Será administrador/a" labelOff="Solo integrante" />
          <Button loading={busy} onClick={add}>
            Registrar correo
          </Button>
        </div>
        {admin && <Notice tone="warn">Un administrador puede cambiar todo el portafolio. Actívalo solo para personas de total confianza.</Notice>}
      </Card>

      {emails.length > 0 && (
        <ul className="space-y-2">
          {emails.map((e) => {
            const linked = members.find((m) => m.id === e.member_id)?.user_id
            return (
              <li key={e.email} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-medium text-[var(--text)]">{e.email}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {nameOf(e.member_id)} · {e.grant_admin ? 'Administrador/a' : 'Integrante'} ·{' '}
                    {linked ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <UserCheck size={14} aria-hidden /> Cuenta activa
                      </span>
                    ) : (
                      <span className="text-[#f5b942]">Aún sin cuenta</span>
                    )}
                  </p>
                </div>
                <Button variant="danger" disabled={busy} onClick={() => remove(e)} aria-label={`Quitar ${e.email}`}>
                  <Trash2 size={15} aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function TeamTab() {
  const { data: members = [], isLoading } = useAdminRows<Member>('members')
  const refresh = useRefresh()
  const { run } = useAction()
  const [editing, setEditing] = useState<Member | null>(null)

  return (
    <div className="space-y-8">
      <TabIntro title="Equipo">Edita las fichas de los integrantes y administra sus cuentas. Arrastra para cambiar el orden en que aparecen.</TabIntro>

      {editing && <MemberEditor key={editing.id} member={editing} onClose={() => setEditing(null)} />}
      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}

      <SortableList
        items={members}
        nameOf={(m) => m.name}
        onReorder={(ids) =>
          run('Orden guardado.', async () => {
            await persistOrder('members', ids)
            await refresh('members')
          })
        }
        render={(m) => (
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={m.name} photoPath={m.photo_path} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--text)]">{m.name}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {m.topic} · {m.role}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setEditing(m)} aria-label={`Editar ${m.name}`}>
              <Pencil size={15} aria-hidden /> Editar
            </Button>
          </div>
        )}
      />

      {members.length > 0 && <EmailsSection members={members} />}
    </div>
  )
}
