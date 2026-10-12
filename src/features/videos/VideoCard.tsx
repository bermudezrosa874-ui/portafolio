import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { AccordionItem } from '../../components/Accordion'
import { SafeFrame } from '../../components/SafeFrame'
import { PLATFORM_LABEL, playerUrl, resolveEmbed } from '../../lib/embed'
import type { BehindScenes, Video } from '../../types'

const BEHIND_LABELS: [keyof BehindScenes, string][] = [
  ['como_se_hizo', 'Cómo se realizó'],
  ['que_investigaron', 'Qué investigaron'],
  ['herramientas', 'Herramientas usadas'],
  ['dificultades', 'Dificultades'],
  ['aprendizajes', 'Aprendizajes'],
]

export function VideoCard({ video, phaseLabel }: { video: Video; phaseLabel: string | null }) {
  const [playing, setPlaying] = useState(false)
  const [behindOpen, setBehindOpen] = useState(false)
  const info = resolveEmbed(video.url)
  const src = playerUrl(info)
  const thumb = info.thumbnail ?? video.thumbnail_url
  const behind = BEHIND_LABELS.filter(([k]) => video.behind_scenes?.[k]?.trim())

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="relative aspect-video bg-black">
        {playing && src ? (
          <SafeFrame src={src} title={`Video: ${video.title}`} />
        ) : (
          <>
            {thumb ? (
              <img
                src={thumb}
                alt=""
                width={480}
                height={360}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#7c3aed55,transparent_60%),radial-gradient(circle_at_70%_70%,#06b6d455,transparent_60%)]" />
            )}
            {src ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Reproducir: ${video.title}`}
                className="group absolute inset-0 grid place-items-center"
              >
                <span className="grid h-20 w-20 place-items-center rounded-full bg-[#f5b942] text-[#071426] shadow-[0_0_0_10px_rgba(245,185,66,0.25)] transition-transform group-hover:scale-110 group-active:scale-95">
                  <Play size={34} fill="currentColor" aria-hidden className="ml-1" />
                </span>
              </button>
            ) : info.valid ? (
              <a
                href={info.openUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 grid place-items-center text-slate-100"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-6 py-3 font-semibold text-[#071426]">
                  <ExternalLink size={18} aria-hidden /> Ver en {PLATFORM_LABEL[info.platform]}
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </span>
              </a>
            ) : (
              <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-slate-300">
                El enlace de este video no es válido.
              </p>
            )}
            {video.duration && (
              <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs tabular-nums text-slate-100">
                {video.duration}
              </span>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 p-5 text-[var(--viewer-text)]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {phaseLabel && <span className="rounded-full bg-teal/20 px-2.5 py-0.5 font-medium text-teal">{phaseLabel}</span>}
          {info.valid && <span className="rounded-full bg-[var(--viewer-hover)] px-2.5 py-0.5">{PLATFORM_LABEL[info.platform]}</span>}
        </div>
        <h3 className="font-serif text-2xl font-semibold text-[var(--viewer-text)]">{video.title}</h3>
        {video.participants && (
          <p className="text-sm">
            <span className="text-[var(--viewer-muted)]">Participantes: </span>
            {video.participants}
          </p>
        )}
        {video.description && <p className="leading-relaxed text-[var(--viewer-muted)]">{video.description}</p>}
        {video.credits && (
          <p className="text-sm">
            <span className="text-[var(--viewer-muted)]">Créditos: </span>
            {video.credits}
          </p>
        )}

        {behind.length > 0 && (
          <AccordionItem
            id={`detras-${video.id}`}
            open={behindOpen}
            onToggle={() => setBehindOpen((o) => !o)}
            headingLevel={4}
            accent="#f5b942"
            className="rounded-xl border border-[var(--border)] bg-[var(--viewer-hover)]"
            buttonClassName="p-3.5"
            header={<span className="font-serif text-lg font-semibold text-gold">Detrás de la entrevista</span>}
          >
            <dl className="space-y-3 px-4 pb-4">
              {behind.map(([key, label]) => (
                <div key={key}>
                  <dt className="text-[11px] uppercase tracking-widest text-[var(--viewer-muted)]">{label}</dt>
                  <dd className="mt-0.5 leading-relaxed text-[var(--viewer-text)]">{video.behind_scenes[key]}</dd>
                </div>
              ))}
            </dl>
          </AccordionItem>
        )}
      </div>
    </article>
  )
}
