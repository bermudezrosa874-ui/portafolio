import { Bell, BellRing, CheckCheck, FolderOpen, Hourglass, RefreshCw, Users } from 'lucide-react'
import { Button, Card, TabIntro } from '../../../components/ui/forms'
import { useToast } from '../../../components/ui/Toast'
import { useQueryClient } from '@tanstack/react-query'
import { useActivity, useContributions, useNotifications, useProfiles, markNotifications } from '../../contributions/api'
import { ACTION_LABEL, fmtAgo, fmtDate, fmtTime } from '../../contributions/model'
import { friendlyError } from '../adminData'

export type TabGo = (id: 'resumen' | 'aportes' | 'colaboradores') => void

const firstName = (full: string) => full.split(' ')[0] || full

const TONES = ['from-sky-400/25 to-violet-400/20', 'from-pink-400/25 to-violet-400/20', 'from-emerald-400/25 to-sky-400/20', 'from-violet-400/25 to-pink-400/20']

/** Resumen de Rosa: cifras del equipo, avisos de nuevos aportes y actividad reciente. */
export default function DashboardTab({ go }: { go?: TabGo }) {
  const toast = useToast()
  const qc = useQueryClient()
  const { data: contributions = [] } = useContributions({ mine: false })
  const { data: notifications = [] } = useNotifications()
  const { data: activity = [] } = useActivity(15)
  const { data: profiles = [] } = useProfiles()

  const unread = notifications.filter((n) => !n.read)
  const stats = [
    { label: 'Colaboradores', value: profiles.filter((p) => p.role === 'collaborator').length, icon: Users },
    { label: 'Aportes', value: contributions.length, icon: FolderOpen },
    { label: 'Por revisar', value: contributions.filter((c) => c.status === 'pending_review').length, icon: Hourglass },
    { label: 'Avisos nuevos', value: unread.length, icon: BellRing },
  ]

  const markAll = async () => {
    try {
      await markNotifications(unread.map((n) => n.id))
      await qc.invalidateQueries({ queryKey: ['notifications'] })
    } catch (e) {
      toast('error', friendlyError(e))
    }
  }

  return (
    <div className="space-y-8">
      <TabIntro title="Resumen del equipo">Aquí ves de un vistazo qué ha subido cada integrante y qué espera tu revisión.</TabIntro>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} data-tile={i + 1} className={`lift rounded-2xl border border-[var(--border)] bg-gradient-to-br ${TONES[i]} p-5`}>
            <p className="text-sm text-[var(--text-muted)]">
              <s.icon size={16} aria-hidden className="mr-1 inline align-[-3px]" /> {s.label}
            </p>
            <p className="mt-1 font-serif text-4xl font-semibold text-[var(--text)]">{s.value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="avisos" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="avisos" className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--text)]">
            <Bell size={20} aria-hidden className="text-pink-300" /> Nuevas aportaciones
          </h3>
          {unread.length > 0 && (
            <Button variant="ghost" onClick={() => void markAll()}>
              <CheckCheck size={15} aria-hidden /> Marcar como leídas
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <Card className="bg-[var(--surface-soft)]!">
            <p className="text-sm text-[var(--text-muted)]">Cuando un compañero suba un archivo, el aviso aparecerá aquí.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {notifications.slice(0, 10).map((n) => (
              <li key={n.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${n.read ? 'border-[var(--border)] opacity-75' : 'border-pink-300/50 bg-pink-400/10'}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {n.kind === 'new_contribution' ? <Bell size={15} aria-hidden className="mr-1.5 inline align-[-2px]" /> : <RefreshCw size={15} aria-hidden className="mr-1.5 inline align-[-2px]" />}
                    {n.kind === 'new_contribution' ? 'Nueva aportación' : 'Aporte actualizado'}
                  </p>
                  <p className="text-sm text-[var(--text)]">
                    <strong>{n.actor_name || 'Un integrante'}</strong> {n.kind === 'new_contribution' ? 'ha subido' : 'modificó'}: «{n.title}»
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {fmtDate(n.created_at)} · {fmtTime(n.created_at)}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => go?.('aportes')}>
                  Revisar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="actividad" className="space-y-3">
        <h3 id="actividad" className="font-serif text-2xl font-semibold text-[var(--text)]">
          Actividad reciente
        </h3>
        {activity.length === 0 ? (
          <Card className="bg-[var(--surface-soft)]!">
            <p className="text-sm text-[var(--text-muted)]">Todavía no hay actividad registrada.</p>
          </Card>
        ) : (
          <Card className="bg-[var(--surface-soft)]!">
            <ul className="divide-y divide-[var(--border)]">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <span className="text-[var(--text)]">
                    <strong>{firstName(a.user_name || 'Alguien')}</strong> {ACTION_LABEL[a.action]}
                    {a.resource_title && ` «${a.resource_title}»`}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{fmtAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}
