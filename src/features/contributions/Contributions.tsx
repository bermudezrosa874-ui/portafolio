import { useState } from 'react'
import { ExternalLink, FolderHeart } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { Reveal } from '../../components/Reveal'
import { PhaseFilterBar } from '../../components/PhaseFilterBar'
import { SectionHeading } from '../../components/SectionHeading'
import { useUi } from '../../lib/uiStore'
import { publicUrl } from '../../lib/upload'
import { usePublishedContributions } from './publicApi'
import { CATEGORY_LABEL, KIND_LABEL, KindIcon, fmtDate, fmtSize, type ContributionCategory } from './model'

type Filter = ContributionCategory | 'todos'

/** Aportes del equipo que la administradora ha publicado. Aparecen aquí apenas pasan a «Publicado». */
export function Contributions() {
  const { data: items = [] } = usePublishedContributions()
  const [filter, setFilter] = useState<Filter>('todos')
  const { phaseFilter } = useUi()
  const phaseIds = [...new Set(items.map((i) => i.phase_id).filter((x): x is number => x !== null))]

  const present = (Object.keys(CATEGORY_LABEL) as ContributionCategory[]).filter((k) => items.some((i) => i.category === k))
  const visible = items.filter((i) => (filter === 'todos' || i.category === filter) && (phaseFilter === null || i.phase_id === phaseFilter))
  const chip = (on: boolean) =>
    `rounded-full border min-h-10 px-3.5 py-2 text-sm transition-colors ${
      on ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <section id="aportes" aria-labelledby="aportes-titulo" className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="aportes-titulo"
          kicker="Trabajo en equipo"
          title="Aportes del equipo"
          intro="Documentos, presentaciones, imágenes, videos y enlaces compartidos por cada integrante del grupo."
        />

        {items.length > 0 && phaseIds.length > 0 && (
          <Reveal className="mb-6 flex justify-center">
            <PhaseFilterBar available={phaseIds} />
          </Reveal>
        )}

        {present.length > 1 && (
          <Reveal className="mb-8">
            <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap justify-center gap-2">
              <button type="button" aria-pressed={filter === 'todos'} className={chip(filter === 'todos')} onClick={() => setFilter('todos')}>
                Todos
              </button>
              {present.map((k) => (
                <button key={k} type="button" aria-pressed={filter === k} className={chip(filter === k)} onClick={() => setFilter(filter === k ? 'todos' : k)}>
                  {CATEGORY_LABEL[k]}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {items.length === 0 ? (
          <EmptyState icon={FolderHeart} title="Aún no hay aportes publicados" text="Cuando el equipo comparta materiales aparecerán aquí." />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {visible.map((c) => {
              const href = c.file_path ? publicUrl('contributions', c.file_path) : c.url
              return (
                <li key={c.id} className="lift flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-sky-400/10 via-transparent to-pink-400/10 p-5 transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-violet-400/20 text-2xl">
                      <KindIcon kind={c.kind} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words font-serif text-xl font-semibold text-[var(--text)]">{c.title}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {KIND_LABEL[c.kind]} · {CATEGORY_LABEL[c.category]}
                        {c.file_path && ` · ${fmtSize(c.size_bytes)}`}
                      </p>
                    </div>
                  </div>
                  {c.description && <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">{c.description}</p>}
                  <p className="mt-auto text-xs text-[var(--text-muted)]">
                    Por <strong className="text-[var(--text)]">{c.uploaded_by_name}</strong> · {fmtDate(c.created_at)}
                  </p>
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#f5b942] px-4 text-sm font-semibold text-[#071426] hover:brightness-110">
                      <ExternalLink size={15} aria-hidden /> Abrir
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
