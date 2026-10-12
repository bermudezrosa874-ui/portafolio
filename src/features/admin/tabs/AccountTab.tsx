import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button, Card, TabIntro } from '../../../components/ui/forms'
import { SetPasswordForm } from '../LoginForm'

/** Mi cuenta: cambiar la contraseña (pide la actual y la nueva). */
export default function AccountTab() {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-6">
      <TabIntro title="Mi cuenta">Aquí puedes cambiar tu contraseña. Te pedimos la actual y la nueva.</TabIntro>
      <Card className="max-w-lg space-y-4">
        <h3 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--text)]">
          <KeyRound size={22} aria-hidden className="text-teal" /> Contraseña
        </h3>
        {open ? (
          <SetPasswordForm mode="change" onDone={() => setOpen(false)} />
        ) : (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Cambiar mi contraseña
          </Button>
        )}
      </Card>
    </div>
  )
}
