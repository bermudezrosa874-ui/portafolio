import { useEffect, useMemo, useState } from 'react'
import { FolderHeart, Pencil, PlusCircle } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { FlipCard } from '../../components/FlipCard'
import { Button, Notice } from '../../components/ui/forms'
import { useLearningData, useMembers, useReflections } from '../../lib/queries'
import { GroupReflectionEditor } from '../reflection/GroupReflectionEditor'
import { REFLECTION_FIELDS, ReflectionEditor } from '../journal/ReflectionEditor'
import { META, isComplete } from '../journal/Journal'
import { useContributions } from './api'
import { ContributionCard } from './ContributionCard'
import { ContributionForm } from './ContributionForm'
import type { Contribution } from './model'

type Sel = number | 'todos'

/**
 * Espacio de cada integrante por fase: su bitácora (4 tarjetas), cuántas fases lleva completas y los
 * aportes que subió a cada una. Lo usan tanto los colaboradores como la administradora (que también es integrante).
 */
export function MyPhases({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const { data: members = [] } = useMembers()
  const { data: reflections = [] } = useReflections()
  const { data: learning } = useLearningData()
  const { data: mine = [], isLoading } = useContributions({ mine: true, userId })

  const me = members.find((m) => m.user_id === userId)
  const phases = learning?.phases ?? []
  const phaseIds = phases.length ? phases.map((p) => p.id) : [1, 2, 3, 4, 5]

  const [sel, setSel] = useState<Sel>(1)
  const [flips, setFlips] = useState([false, false, false, false])
  const [writing, setWriting] = useState(false)
  const [form, setForm] = useState<Contribution | 'new' | null>(null)

  useEffect(() => {
    setFlips([false, false, false, false])
    setWriting(false)
  }, [sel])

  const myReflections = useMemo(() => new Map(reflections.filter((r) => r.member_id === me?.id).map((r) => [r.phase_id, r])), [reflections, me?.id])
  const done = phaseIds.filter((id) => isComplete(myReflections.get(id))).length
  const countOf = (id: number) => mine.filter((c) => c.phase_id === id).length

  const phase = typeof sel === 'number' ? phases.find((p) => p.id === sel) : undefined
  const current = typeof sel === 'number' ? myReflections.get(sel) : undefined
  const items = typeof sel === 'number' ? mine.filter((c) => c.phase_id === sel) : mine
  const allFlipped = flips.every(Boolean)

  if (form) {
    return (
      <ContributionForm
        userId={userId}
        isAdmin={isAdmin}
        initial={form === 'new' ? undefined : form}
        defaultPhase={typeof sel === 'number' ? sel : undefined}
        onDone={() => setForm(null)}
        onCancel={() => setForm(null)}
      />
    )
  }

  const chip = (on: boolean) =>
    `min-h-10 rounded-full border px-4 py-2 text-sm transition-colors ${
      on ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-serif text-3xl font-semibold text-gold">Mis fases</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Cada fase tiene tu bitácora y tus aportes. {me ? `Llevas ${done}/${phaseIds.length} fases completadas.` : ''}
        </p>
      </header>

      {!me && (
        <Notice tone="warn">
          Tu cuenta no está enlazada con una ficha de integrante, así que no puedes escribir reflexiones. Tus aportes por fase sí funcionan.
        </Notice>
      )}

      <div role="group" aria-label="Elegir fase" className="flex flex-wrap gap-2">
        {phaseIds.map((id) => (
          <button key={id} type="button" aria-pressed={sel === id} title={phases.find((p) => p.id === id)?.title} onClick={() => setSel(id)} className={chip(sel === id)}>
            Fase {id}
            {me && isComplete(myReflections.get(id)) && <span aria-hidden> ✓</span>}
            <span className="ml-1.5 text-xs opacity-80">({countOf(id)})</span>
          </button>
        ))}
        <button type="button" aria-pressed={sel === 'todos'} onClick={() => setSel('todos')} className={chip(sel === 'todos')}>
          Todos mis aportes ({mine.length})
        </button>
      </div>

      {typeof sel === 'number' && (
        <section aria-labelledby="bitacora-fase" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="bitacora-fase" className="font-serif text-2xl font-semibold text-[var(--text)]">
                {me ? `${me.name.replace(/\[[^\]]*\]/g, '').trim()} · ` : ''}Fase {sel}
              </h3>
              {phase && <p className="text-sm text-[var(--text-muted)]">{phase.title}</p>}
            </div>
            {me && !writing && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setFlips(allFlipped ? [false, false, false, false] : [true, true, true, true])}>
                  {allFlipped ? 'Mostrar frentes' : 'Voltear todas'}
                </Button>
                {phase && (
                  <Button onClick={() => setWriting(true)}>
                    <Pencil size={15} aria-hidden /> {isComplete(current) ? 'Editar reflexión' : 'Escribir reflexión'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {me && writing && phase ? (
            <ReflectionEditor member={me} phase={phase} existing={current} onDone={() => setWriting(false)} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {REFLECTION_FIELDS.map(({ key, title }, i) => {
                const { icon: Icon, color } = META[key]
                const text = current?.[key]?.trim()
                return (
                  <li key={key}>
                    <FlipCard
                      accent={color}
                      flipped={flips[i]}
                      onToggle={() => setFlips((f) => f.map((v, j) => (j === i ? !v : v)))}
                      className="h-56"
                      front={
                        <span className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
                          <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${color}22`, color }}>
                            <Icon size={28} aria-hidden />
                          </span>
                          <span className="font-serif text-2xl font-semibold leading-tight text-[var(--text)]">{title}</span>
                          <span className="text-xs text-[var(--text-muted)]">Toca para leer</span>
                        </span>
                      }
                      back={
                        <span className="block p-5">
                          <span className="mb-2 block font-serif text-lg font-semibold" style={{ color: `color-mix(in srgb, ${color} 55%, var(--text))` }}>
                            {title}
                          </span>
                          {text ? (
                            <span className="block whitespace-pre-line leading-relaxed text-[var(--text)]">{text}</span>
                          ) : (
                            <span className="block italic text-[var(--text-muted)]">Aún no hay reflexión en este apartado.</span>
                          )}
                        </span>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="aportes-fase" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="aportes-fase" className="font-serif text-2xl font-semibold text-[var(--text)]">
            {typeof sel === 'number' ? `Mis aportes de la Fase ${sel}` : 'Todos mis aportes'}
          </h3>
          <Button onClick={() => setForm('new')}>
            <PlusCircle size={16} aria-hidden /> {typeof sel === 'number' ? `Subir a la Fase ${sel}` : 'Subir nuevo recurso'}
          </Button>
        </div>
        {isLoading ? (
          <p className="text-[var(--text-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <EmptyState icon={FolderHeart} title="Todavía no hay aportes aquí" text={typeof sel === 'number' ? `Sube lo que hiciste en la Fase ${sel}.` : 'Pulsa «Subir nuevo recurso» para compartir el primero.'} />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {items.map((c) => (
              <ContributionCard key={c.id} c={c} isAdmin={isAdmin} onEdit={setForm} />
            ))}
          </ul>
        )}
      </section>

      <GroupReflectionEditor userId={userId} isAdmin={isAdmin} />
    </div>
  )
}
