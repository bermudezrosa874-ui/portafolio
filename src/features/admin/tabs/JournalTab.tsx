import { useState } from 'react'
import { Check, Minus, Trash2 } from 'lucide-react'
import { Button, Card, Notice, TabIntro } from '../../../components/ui/forms'
import { useConfirm } from '../../../components/ui/Confirm'
import { useAction, useAdminRows, useRefresh, deleteRow } from '../adminData'
import { ReflectionEditor } from '../../journal/ReflectionEditor'
import type { Member, Phase, Reflection } from '../../../types'

const complete = (r: Reflection | undefined) => !!r && [r.aprendi, r.dificulto, r.sorprendio, r.quisiera_aprender].every((t) => t.trim())
const started = (r: Reflection | undefined) => !!r && [r.aprendi, r.dificulto, r.sorprendio, r.quisiera_aprender].some((t) => t.trim())
const plain = (name: string) => name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante'

export default function JournalTab() {
  const { data: members = [] } = useAdminRows<Member>('members')
  const { data: phases = [] } = useAdminRows<Phase>('phases')
  const { data: reflections = [] } = useAdminRows<Reflection>('reflections', [['created_at', true]])
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [sel, setSel] = useState<{ memberId: string; phaseId: number } | null>(null)

  const find = (m: string, p: number) => reflections.find((r) => r.member_id === m && r.phase_id === p)
  const member = members.find((m) => m.id === sel?.memberId)
  const phase = phases.find((p) => p.id === sel?.phaseId)
  const existing = sel ? find(sel.memberId, sel.phaseId) : undefined

  const remove = async () => {
    if (!existing || !member || !phase) return
    const ok = await confirm({
      title: '¿Borrar esta reflexión?',
      message: `Se borrarán las 4 respuestas de ${plain(member.name)} en la Fase ${phase.id}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Borrar reflexión',
      danger: true,
    })
    if (!ok) return
    await run('Reflexión borrada.', async () => {
      await deleteRow('reflections', existing.id)
      await refresh('reflections')
      setSel(null)
    })
  }

  return (
    <div className="space-y-6">
      <TabIntro title="Bitácora del equipo">
        Como administradora puedes escribir o corregir las reflexiones de cualquier integrante. Cada integrante, desde su cuenta, solo puede editar las suyas.
      </TabIntro>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Avance de reflexiones por integrante y fase</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left font-medium text-[var(--text-muted)]">Integrante</th>
              {phases.map((p) => (
                <th key={p.id} scope="col" className="p-2 text-center font-medium text-[var(--text-muted)]" title={p.title}>
                  Fase {p.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-[var(--border)]">
                <th scope="row" className="p-2 text-left font-medium text-[var(--text)]">
                  {plain(m.name)}
                </th>
                {phases.map((p) => {
                  const r = find(m.id, p.id)
                  const on = sel?.memberId === m.id && sel.phaseId === p.id
                  const state = complete(r) ? 'completa' : started(r) ? 'incompleta' : 'vacía'
                  return (
                    <td key={p.id} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => setSel({ memberId: m.id, phaseId: p.id })}
                        aria-label={`${plain(m.name)}, fase ${p.id}: reflexión ${state}. Abrir`}
                        aria-pressed={on}
                        className={`grid h-10 w-full min-w-10 place-items-center rounded-lg border ${
                          on ? 'border-gold bg-gold/15' : 'border-transparent hover:bg-[var(--hover)]'
                        } ${state === 'completa' ? 'text-emerald-500' : state === 'incompleta' ? 'text-[#f5b942]' : 'text-[var(--text-muted)]'}`}
                      >
                        {state === 'completa' ? <Check size={18} aria-hidden /> : state === 'incompleta' ? <span aria-hidden>…</span> : <Minus size={16} aria-hidden />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[var(--text-muted)]">✓ completa · … incompleta · – vacía. Toca una celda para escribir o corregir.</p>
      </Card>

      {sel && member && phase ? (
        <div className="space-y-3">
          <ReflectionEditor key={`${sel.memberId}-${sel.phaseId}-${existing?.id ?? 'nueva'}`} member={member} phase={phase} existing={existing} onDone={() => setSel(null)} />
          {existing && (
            <Button variant="danger" disabled={busy} onClick={remove}>
              <Trash2 size={16} aria-hidden /> Borrar esta reflexión
            </Button>
          )}
        </div>
      ) : (
        <Notice>Elige una celda de la tabla para editar esa reflexión.</Notice>
      )}
    </div>
  )
}
