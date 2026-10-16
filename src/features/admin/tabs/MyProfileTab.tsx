import { useRole } from '../../../hooks/useAuth'
import { useMembers } from '../../../lib/queries'
import { ProfileEditor } from '../../team/ProfileEditor'

/** «Mi perfil» de la administradora: edita el suyo y, si lo necesita, el de cualquier integrante. */
export default function MyProfileTab() {
  const { session, isAdmin } = useRole()
  const { data: members = [] } = useMembers()
  return <ProfileEditor members={members} userId={session?.user.id ?? ''} isAdmin={isAdmin} />
}
