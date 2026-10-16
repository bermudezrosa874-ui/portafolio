import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useConfirm } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { Button, Notice } from '../../components/ui/forms'
import { charLength, plainName, tintOf, memberColor } from '../../lib/members'
import { useGroupEntries, useMembers } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { friendlyError } from '../admin/adminData'
import type { GroupCard, GroupEntry, Member } from '../../types'
import { Byline, GROUP_CARD_META } from './GroupReflection'

export const GROUP_ENTRY_MAX = 400

/** Cada integrante escribe su aporte en cada tarjeta; solo edita o borra el suyo (la administradora puede borrar cualquiera). */
export function GroupReflectionEditor({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const { data: members = [] } = useMembers()
  const { data: entries = [] } = useGroupEntries()
  const me = members.find((m) => m.user_id === userId)
  const byId = new Map(members.map((m) => [m.id, m]))
  const contributors = new Set(entries.map((e) => e.member_id)).size

  return (
    <section aria-labelledby="grupal" className="space-y-4">
      <div>
        <h3 id="grupal" className="font-serif text-2xl font-semibold text-[var(--text)]">
          Reflexión grupal · Lo que aprendimos
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          {contributors} de {members.length} integrantes {contributors === 1 ? 'ha aportado' : 'han aportado'}. Escribe tu aporte en cada tarjeta (máximo {GROUP_ENTRY_MAX} caracteres): lo verán todos en el portafolio con tus iniciales y tu nombre.
        </p>
      </div>

      {!me && <Notice tone="warn">Tu cuenta no está enlazada con una ficha de integrante, así que no puedes escribir aportes grupales.</Notice>}

      <div className="grid gap-4 lg:grid-cols-3">
        {GROUP_CARD_META.map(({ id, title, hint, icon: Icon, color }) => {
          const list = entries.filter((e) => e.card === id)
          const mine = me ? list.find((e) => e.member_id === me.id) : undefined
          const others = list.filter((e) => e.member_id !== me?.id)
          return (
            <article key={id} className="soft-shadow space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ borderTop: `3px solid ${color}` }}>
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                  <Icon size={22} aria-hidden />
                </span>
                <h4 className="mt-3 font-serif text-xl font-semibold text-[var(--text)]">{title}</h4>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{hint}</p>
              </div>

              {me && <EntryField key={`${id}-${mine?.updated_at ?? 'nuevo'}`} card={id} title={title} member={me} entry={mine} />}

              {others.length > 0 && (
                <ul className="space-y-2" aria-label={`Aportes de los demás en ${title}`}>
                  {others.map((e) => {
                    const m = byId.get(e.member_id)
                    if (!m) return null
                    return <OtherEntry key={e.id} entry={e} member={m} canDelete={isAdmin} />
                  })}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function useRefreshEntries() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['group_entries'] }), qc.invalidateQueries({ queryKey: ['participation'] })])
}

function EntryField({ card, title, member, entry }: { card: GroupCard; title: string; member: Member; entry: GroupEntry | undefined }) {
  const toast = useToast()
  const confirm = useConfirm()
  const refresh = useRefreshEntries()
  const [text, setText] = useState(entry?.content ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const id = `grupal-${card}`
  const len = charLength(text)
  const dirty = text.trim() !== (entry?.content ?? '')

  const save = async () => {
    const value = text.trim()
    if (!value) return setError('Escribe tu aporte antes de guardar.')
    if (charLength(value) > GROUP_ENTRY_MAX) return setError(`Máximo ${GROUP_ENTRY_MAX} caracteres.`)
    setError(undefined)
    setBusy(true)
    const { error: e } = await supabase.from('group_reflection_entries').upsert({ card, member_id: member.id, content: value }, { onConflict: 'card,member_id' })
    setBusy(false)
    if (e) return toast('error', friendlyError(e))
    await refresh()
    toast('ok', 'Tu aporte quedó guardado.')
  }

  const remove = async () => {
    if (!entry) return
    const ok = await confirm({ title: '¿Borrar tu aporte?', message: `Se quitará tu aporte de «${title}».`, confirmLabel: 'Borrar aporte', danger: true })
    if (!ok) return
    setBusy(true)
    const { error: e } = await supabase.from('group_reflection_entries').delete().eq('id', entry.id)
    setBusy(false)
    if (e) return toast('error', friendlyError(e))
    setText('')
    await refresh()
    toast('ok', 'Aporte borrado.')
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text)]">
        Tu aporte
      </label>
      <textarea
        id={id}
        rows={5}
        value={text}
        maxLength={GROUP_ENTRY_MAX + 20}
        aria-invalid={!!error}
        aria-describedby={`${id}-info`}
        onChange={(e) => setText(e.target.value)}
        className={`mt-1 w-full rounded-xl border bg-[var(--card)] p-3 text-sm text-[var(--text)] outline-none focus:border-gold ${error ? 'border-red-500' : 'border-[var(--border)]'}`}
      />
      <p id={`${id}-info`} className={`mt-1 text-xs tabular-nums ${error || len > GROUP_ENTRY_MAX ? 'text-red-500' : 'text-[var(--text-muted)]'}`} role={error ? 'alert' : undefined}>
        {error ?? `${len} / ${GROUP_ENTRY_MAX}`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button loading={busy} disabled={!dirty || len > GROUP_ENTRY_MAX} onClick={save}>
          {entry ? 'Guardar cambios' : 'Publicar aporte'}
        </Button>
        {entry && (
          <Button variant="secondary" disabled={busy} onClick={remove} aria-label={`Borrar mi aporte de ${title}`}>
            <Trash2 size={15} aria-hidden /> Borrar
          </Button>
        )}
      </div>
    </div>
  )
}

function OtherEntry({ entry, member, canDelete }: { entry: GroupEntry; member: Member; canDelete: boolean }) {
  const toast = useToast()
  const confirm = useConfirm()
  const refresh = useRefreshEntries()
  const c = memberColor(member)

  const remove = async () => {
    const ok = await confirm({ title: '¿Borrar este aporte?', message: `Se quitará el aporte de ${plainName(member.name)}.`, confirmLabel: 'Borrar aporte', danger: true })
    if (!ok) return
    const { error } = await supabase.from('group_reflection_entries').delete().eq('id', entry.id)
    if (error) return toast('error', friendlyError(error))
    await refresh()
    toast('ok', 'Aporte borrado.')
  }

  return (
    <li className="rounded-xl p-3" style={{ background: tintOf(c, 10), borderLeft: `3px solid ${c}` }}>
      <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text)]">{entry.content}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Byline member={member} />
        {canDelete && (
          <button type="button" onClick={remove} aria-label={`Borrar el aporte de ${plainName(member.name)}`} className="grid h-8 w-8 place-items-center rounded-full text-red-500 hover:bg-red-500/10">
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </div>
    </li>
  )
}
