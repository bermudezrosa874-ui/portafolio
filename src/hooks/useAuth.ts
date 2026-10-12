import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
const getSupabase = async () => (await import('../lib/supabase')).supabase

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    // Se carga después de pintar la página: el visitante sin cuenta no necesita esperarlo.
    getSupabase().then((supabase) => {
      if (cancelled) return
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return
        setSession(data.session)
        setReady(true)
      })
      const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { session, ready }
}

/** Rol del usuario con sesión: 'admin' (Rosa), 'collaborator', 'user' o null (visitante). La RLS es la defensa real. */
export function useRole() {
  const { session, ready } = useSession()
  const userId = session?.user.id
  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['role', userId],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from('profiles').select('role').eq('user_id', userId!).maybeSingle()
      if (error) throw error
      return (data?.role as 'admin' | 'collaborator' | 'user' | undefined) ?? null
    },
  })
  return {
    session,
    ready,
    roleLoading: !!userId && roleLoading,
    role: userId ? (role ?? null) : null,
    isAdmin: role === 'admin',
    isCollaborator: role === 'collaborator',
    userName: session?.user.email ?? null,
  }
}
