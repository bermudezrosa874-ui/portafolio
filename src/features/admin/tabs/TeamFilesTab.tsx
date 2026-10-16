import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { EmptyState } from '../../../components/EmptyState'
import { Button, TabIntro } from '../../../components/ui/forms'
import { useRole } from '../../../hooks/useAuth'
import { useMembers } from '../../../lib/queries'
import { useContributions } from '../../contributions/api'
import { ContributionCard } from '../../contributions/ContributionCard'
import { ContributionForm } from '../../contributions/ContributionForm'
import { STATUS_LABEL, type Contribution, type ContributionStatus } from '../../contributions/model'
import { FolderHeart } from 'lucide-react'

const shortName = (full: string) => full.replace(/\[[^\]]*\]/g, '').trim().split(' ').slice(0, 2).join(' ')

/** Archivos y aportes de todo el equipo, filtrables por integrante. la administradora los administra todos. */
export default function TeamFilesTab() {
  const { session } = useRole()
  const userId = session?.user.id ?? ''
  const { data: members = [] } = useMembers()
  const { data: items = [], isLoading } = useContributions({ mine: false })
  const [who, setWho] = useState<string>('todos')
  const [status, setStatus] = useState<ContributionStatus | 'todos'>('todos')
  const [phase, setPhase] = useState<string>('todas')
  const [form, setForm] = useState<Contribution | 'new' | null>(null)

  const owner = members.find((m) => m.id === who)
  const visible = items.filter(
    (c) => (who === 'todos' || (owner?.user_id ? c.uploaded_by === owner.user_id : false)) && (status === 'todos' || c.status === status) && (phase === 'todas' || (phase === 'sin' ? c.phase_id === null : c.phase_id === Number(phase))),
  )
  const countOf = (uid: string | null) => (uid ? items.filter((c) => c.uploaded_by === uid).length : 0)

  const chip = (on: boolean) =>
    `rounded-full border min-h-10 px-3.5 py-2 text-sm transition-colors ${
      on ? 'border-violet-300 bg-violet-400/25 font-semibold text-[var(--text)]' : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)]'
    }`

  if (form) {
    return (
      <ContributionForm userId={userId} isAdmin initial={form === 'new' ? undefined : form} onDone={() => setForm(null)} onCancel={() => setForm(null)} />
    )
  }

  return (
    <div className="space-y-6">
      <TabIntro title="Archivos / aportes del equipo">
        Todo lo que suben los integrantes, con quién lo subió, cuándo y en qué estado. Pulsa «Publicar» y el aporte aparece de inmediato en el portafolio.
      </TabIntro>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setForm('new')}>
          <PlusCircle size={16} aria-hidden /> Subir recurso
        </Button>
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as ContributionStatus | 'todos')} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--text)]">
            <option value="todos">Todos</option>
            {(Object.keys(STATUS_LABEL) as ContributionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          Fase
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--text)]">
            <option value="todas">Todas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Fase {n}
              </option>
            ))}
            <option value="sin">Sin fase</option>
          </select>
        </label>
      </div>

      <div role="group" aria-label="Filtrar por integrante" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={who === 'todos'} className={chip(who === 'todos')} onClick={() => setWho('todos')}>
          Todos ({items.length})
        </button>
        {members.map((m) => (
          <button key={m.id} type="button" aria-pressed={who === m.id} className={chip(who === m.id)} onClick={() => setWho(m.id)}>
            {shortName(m.name)} ({countOf(m.user_id)})
          </button>
        ))}
      </div>

      {owner && !owner.user_id && (
        <p className="rounded-xl border-l-4 border-[#f5b942] bg-[#f5b942]/10 p-3.5 text-sm text-[var(--text)]">
          {shortName(owner.name)} todavía no tiene cuenta enlazada. Registra su correo en la pestaña «Equipo» para que pueda subir archivos.
        </p>
      )}

      {isLoading ? (
        <p className="text-[var(--text-muted)]">Cargando…</p>
      ) : visible.length === 0 ? (
        <EmptyState icon={FolderHeart} title="No hay aportes con este filtro" text="Prueba con otro integrante o estado." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => (
            <ContributionCard key={c.id} c={c} isAdmin showUploader onEdit={setForm} />
          ))}
        </ul>
      )}
    </div>
  )
}
