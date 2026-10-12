import { useRole } from '../../../hooks/useAuth'
import { MyPhases } from '../../contributions/MyPhases'

/** Rosa también es integrante: ve su bitácora y sus aportes por fase, igual que sus compañeros. */
export default function MyContributionsTab() {
  const { session } = useRole()
  return <MyPhases userId={session?.user.id ?? ''} isAdmin />
}
