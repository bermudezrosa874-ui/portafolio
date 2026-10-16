import { useQuery } from '@tanstack/react-query'
import { Card, TabIntro } from '../../../components/ui/forms'
import { plainName } from '../../../lib/members'
import { supabase } from '../../../lib/supabase'

interface LoginRow {
  member_id: string
  name: string
  last_login: string | null
}

const bogota = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

/** Última conexión de cada integrante, en hora de Bogotá. Solo la administradora la ve (lo impone la base). */
export default function LoginsTab() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['login_overview'],
    queryFn: async (): Promise<LoginRow[]> => {
      const { data, error } = await supabase.rpc('admin_login_overview')
      if (error) throw error
      return (data ?? []) as LoginRow[]
    },
    refetchInterval: 60_000,
  })

  return (
    <div className="space-y-6">
      <TabIntro title="Últimas conexiones">De más reciente a más antigua, en hora de Bogotá (America/Bogota).</TabIntro>
      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}
      {error && <p role="alert" className="text-sm text-red-500">No se pudieron cargar las conexiones.</p>}
      {!isLoading && !error && (
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((r) => (
              <li key={r.member_id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-[var(--text)]">{plainName(r.name)}</span>
                <span className={r.last_login ? 'tabular-nums text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                  {r.last_login ? bogota(r.last_login) : 'Nunca ha iniciado sesión'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
