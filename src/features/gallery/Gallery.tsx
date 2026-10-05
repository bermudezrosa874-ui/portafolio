import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ImageOff } from 'lucide-react'
import { CountUp } from '../../components/CountUp'
import { EmptyState } from '../../components/EmptyState'
import { PhaseFilterBar } from '../../components/PhaseFilterBar'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useEvidences, useLearningData, useMembers } from '../../lib/queries'
import { useUi } from '../../lib/uiStore'
import { publicUrl } from '../../lib/upload'
import type { Evidence, EvidenceCategory } from '../../types'
import { CATEGORY_LABEL, Lightbox } from './Lightbox'

function Thumb({ item, onOpen }: { item: Evidence; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const ratio = item.width && item.height ? `${item.width} / ${item.height}` : '4 / 3'
  return (
    <motion.button
      type="button"
      layoutId={`ev-${item.id}`}
      onClick={onOpen}
      aria-label={`Ampliar: ${item.title}`}
      whileHover={{ y: -3 }}
      className="group relative block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet/20 to-teal/20"
      style={{ aspectRatio: ratio }}
    >
      <img
        src={publicUrl('evidences', item.thumb_path ?? item.image_path)}
        alt={item.title}
        width={item.width ?? 640}
        height={item.height ?? 480}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-left text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {item.title}
      </span>
    </motion.button>
  )
}

export function Gallery() {
  const { data: evidences = [] } = useEvidences()
  const { data: members = [] } = useMembers()
  const { data: learning } = useLearningData()
  const { phaseFilter } = useUi()
  const [category, setCategory] = useState<EvidenceCategory | 'todas'>('todas')
  const [open, setOpen] = useState<{ index: number; id: string } | null>(null)

  const visible = evidences.filter(
    (e) => (category === 'todas' || e.category === category) && (phaseFilter === null || e.phase_id === phaseFilter),
  )
  const categoriesPresent = (Object.keys(CATEGORY_LABEL) as EvidenceCategory[]).filter((c) => evidences.some((e) => e.category === c))
  const phaseIds = [...new Set(evidences.map((e) => e.phase_id).filter((x): x is number => x !== null))]

  const chip = (on: boolean) =>
    `rounded-full border min-h-10 px-3.5 py-2 text-sm transition-colors ${
      on
        ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]'
        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="galeria-titulo"
          kicker="Evidencias del trabajo colaborativo"
          title="Galería académica"
          intro="Capturas, conversaciones del grupo, aportes en el foro, grabaciones, bocetos e investigación: el proceso detrás de cada producto."
        />
        <p className="-mt-6 mb-8 text-center text-sm text-[var(--text-muted)]">
          <CountUp value={evidences.length} className="font-serif text-2xl text-gold" />{' '}
          {evidences.length === 1 ? 'evidencia publicada' : 'evidencias publicadas'}
        </p>

        {evidences.length > 0 && (
          <Reveal className="mb-8 space-y-3">
            <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap justify-center gap-2">
              <button type="button" aria-pressed={category === 'todas'} className={chip(category === 'todas')} onClick={() => setCategory('todas')}>
                Todas las categorías
              </button>
              {categoriesPresent.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} className={chip(category === c)} onClick={() => setCategory(category === c ? 'todas' : c)}>
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <PhaseFilterBar available={phaseIds} />
            </div>
          </Reveal>
        )}

        {evidences.length === 0 ? (
          <EmptyState icon={ImageOff} title="Aún no hay evidencias publicadas" text="Las imágenes del proceso aparecerán aquí." />
        ) : visible.length === 0 ? (
          <EmptyState icon={ImageOff} title="Ninguna evidencia coincide con estos filtros" text="Prueba con otra categoría u otra fase." />
        ) : (
          <ul className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {visible.map((e, i) => (
              <li key={e.id} className="mb-3 break-inside-avoid">
                <Thumb item={e} onOpen={() => setOpen({ index: i, id: e.id })} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {open && visible[open.index] && (
          <Lightbox
            items={visible}
            index={open.index}
            openedId={open.id}
            members={members}
            phases={learning?.phases ?? []}
            onIndex={(i) => setOpen({ index: i, id: open.id })}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
