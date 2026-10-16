import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarRange, CheckCircle2, FileText, Film, Puzzle, Unlock, type LucideIcon } from 'lucide-react'
import { useConfirm } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { useRole } from '../../hooks/useAuth'
import { useResources, useVideos } from '../../lib/queries'
import type { Deliverable, Phase } from '../../types'
import { friendlyError } from '../admin/adminData'
import { PhaseUploader } from './PhaseUploader'

export type PanelTarget = 'recursos' | 'entrevistas'

interface Slot {
  id: string
  label: string
  hint: string
  icon: LucideIcon
  taken: boolean
  target?: PanelTarget
}

const getSupabase = async () => (await import('../../lib/supabase')).supabase

/**
 * «¿Qué hiciste en esta fase?» Solo muestra lo que todavía se puede subir: cada espacio (documento, recurso digital y video)
 * se ocupa una sola vez y, cuando ya está subido, deja de aparecer. Muchas fases solo llevan el documento: por eso, cuando
 * ya hay algo subido, se pregunta «¿Hiciste algo más?» y se puede responder «No, la fase está completa». Una fase completa
 * deja de mostrar este bloque (la administradora puede reabrirla). Solo lo ven la administradora y los colaboradores.
 *
 * `go`: si se indica (dentro del panel), los botones cambian de sección del panel; si no, llevan a /admin.
 */
export function PhaseSlots({ phase, deliverable, go }: { phase: Phase; deliverable: Deliverable | undefined; go?: (target: PanelTarget) => void }) {
  const { session, isAdmin, userName } = useRole()
  const { data: resources = [] } = useResources()
  const { data: videos = [] } = useVideos()
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!session) return null

  const phaseSlots: Slot[] = [
    { id: 'documento', label: 'Documento de entrega', hint: 'PDF o Word de la fase', icon: FileText, taken: !!deliverable },
    { id: 'recurso', label: 'Recurso digital', hint: 'Genially, Canva, Padlet…', icon: Puzzle, taken: resources.some((r) => r.kind !== 'timeline' && r.phase_id === phase.id), target: 'recursos' },
    { id: 'video', label: 'Video o entrevista', hint: 'Enlace de YouTube, Drive…', icon: Film, taken: videos.some((v) => v.phase_id === phase.id), target: 'entrevistas' },
  ]
  const timeline: Slot = { id: 'linea', label: 'Línea de tiempo', hint: 'Una sola para todo el portafolio', icon: CalendarRange, taken: resources.some((r) => r.kind === 'timeline'), target: 'recursos' }

  const refresh = () => qc.invalidateQueries({ queryKey: ['learning'] })

  const closePhase = async () => {
    const yes = await confirm({
      title: 'Cerrar la fase',
      message: `¿Confirmas que en la Fase ${phase.id} no hay nada más que subir? Se marcará como completa y dejará de aparecer este bloque.`,
      confirmLabel: 'Sí, está completa',
    })
    if (!yes) return
    setBusy(true)
    try {
      const { error } = await (await getSupabase()).rpc('close_phase_uploads', { p_phase: phase.id })
      if (error) throw error
      await refresh()
      toast('ok', `Fase ${phase.id} completa.`)
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const reopen = async () => {
    setBusy(true)
    try {
      const { data, error } = await (await getSupabase()).from('phases').update({ uploads_closed: false }).eq('id', phase.id).select('id')
      if (error || !data?.length) throw error ?? new Error('No se pudo reabrir.')
      await refresh()
      toast('ok', `Fase ${phase.id} reabierta.`)
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const action = 'inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50'
  const allTaken = phaseSlots.every((s) => s.taken)

  // Fase completa (cerrada a mano o con sus tres espacios llenos): el bloque desaparece. Solo la administradora ve cómo reabrir.
  if (phase.uploads_closed || allTaken) {
    if (!isAdmin || !phase.uploads_closed) return null
    return (
      <p className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
        <CheckCircle2 size={16} aria-hidden /> Esta fase está completa.
        <button type="button" disabled={busy} onClick={() => void reopen()} className="inline-flex items-center gap-1.5 text-teal underline underline-offset-4 disabled:opacity-50">
          <Unlock size={14} aria-hidden /> Reabrir subidas
        </button>
      </p>
    )
  }

  const anyTaken = phaseSlots.some((s) => s.taken)
  const free = [...phaseSlots, timeline].filter((s) => !s.taken)

  return (
    <section aria-labelledby={`slots-${phase.id}`} className="space-y-3">
      <div>
        <h4 id={`slots-${phase.id}`} className="font-serif text-xl font-semibold text-[var(--text)]">
          {anyTaken ? '¿Hiciste algo más en esta fase?' : '¿Qué hiciste en esta fase?'}
        </h4>
        <p className="text-sm text-[var(--text-muted)]">
          Elige lo que hiciste. Cada espacio se ocupa una sola vez: cuando alguien lo sube, ya no aparece aquí.
          {anyTaken && ' Si no hay nada más, marca la fase como completa.'}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {free.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--border)] text-[var(--text)]">
              <s.icon size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--text)]">{s.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.hint}</p>
            </div>
            {s.target ? (
              go ? (
                <button type="button" className={action} onClick={() => go(s.target!)}>
                  Subir
                </button>
              ) : (
                <Link to={`/admin#${s.target}`} className={action}>
                  Subir
                </Link>
              )
            ) : (
              <button type="button" onClick={() => setUploading((u) => !u)} className={action}>
                Subir
              </button>
            )}
          </li>
        ))}
      </ul>

      {uploading && !deliverable && <PhaseUploader phaseId={phase.id} existing={undefined} userId={session.user.id} userName={userName} />}

      {anyTaken && (
        <button type="button" disabled={busy} onClick={() => void closePhase()} className={`${action} gap-2`}>
          <CheckCircle2 size={16} aria-hidden /> No, la fase está completa
        </button>
      )}
    </section>
  )
}
