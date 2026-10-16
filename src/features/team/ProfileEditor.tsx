import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Button, Card, Notice, SelectField, TextArea } from '../../components/ui/forms'
import { Dropzone } from '../../components/ui/Dropzone'
import { useToast } from '../../components/ui/Toast'
import { validateImage } from '../../lib/fileValidation'
import { processAvatar, type ProcessedImage } from '../../lib/image'
import { ABOUT_MAX, CONTRIBUTION_MAX, QUOTE_MAX, SYMBOL_MAX, SYMBOL_SUGGESTIONS, charLength, inkOf, memberColor, plainName, tintOf } from '../../lib/members'
import { supabase } from '../../lib/supabase'
import { dropFile, friendlyError, uploadImage } from '../admin/adminData'
import type { Member } from '../../types'
import { SymbolBadge } from './MemberBits'

/** «Mi perfil» del modo edición: cada integrante edita solo el suyo; la administradora puede editar el de cualquiera. */
export function ProfileEditor({ members, userId, isAdmin }: { members: Member[]; userId: string; isAdmin: boolean }) {
  const mine = members.find((m) => m.user_id === userId)
  const [pickedId, setPickedId] = useState<string | undefined>(undefined)
  const member = (isAdmin && members.find((m) => m.id === pickedId)) || mine

  if (!member) {
    return <Notice tone="warn">Tu cuenta todavía no está enlazada con una ficha de integrante, así que no puedes editar un perfil.</Notice>
  }

  return (
    <div className="space-y-4">
      {isAdmin && members.length > 1 && (
        <SelectField
          label="Perfil que vas a editar"
          value={member.id}
          onChange={setPickedId}
          options={members.map((m) => ({ value: m.id, label: `${plainName(m.name)}${m.id === mine?.id ? ' (tú)' : ''}` }))}
        />
      )}
      <ProfileForm key={member.id} member={member} userId={userId} />
    </div>
  )
}

function ProfileForm({ member, userId }: { member: Member; userId: string }) {
  const qc = useQueryClient()
  const toast = useToast()
  const color = memberColor(member)
  const [symbol, setSymbol] = useState(member.symbol)
  const [about, setAbout] = useState(member.about)
  const [quote, setQuote] = useState(member.quote)
  const [contribution, setContribution] = useState(/^(muy pronto|próximamente)/i.test(member.contribution) ? '' : member.contribution)
  const [newPhoto, setNewPhoto] = useState<{ img: ProcessedImage; url: string } | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'symbol' | 'about' | 'quote' | 'contribution', string>>>({})

  const onPhoto = async (files: File[]) => {
    setPhotoError(null)
    const check = await validateImage(files[0])
    if (!check.ok) return setPhotoError(check.error)
    try {
      setProcessing(true)
      const img = await processAvatar(files[0])
      if (newPhoto) URL.revokeObjectURL(newPhoto.url)
      setNewPhoto({ img, url: URL.createObjectURL(img.blob) })
      setRemovePhoto(false)
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'No se pudo preparar la foto.')
    } finally {
      setProcessing(false)
    }
  }

  const validate = () => {
    const next: typeof errors = {}
    if (charLength(symbol.trim()) > SYMBOL_MAX) next.symbol = `Máximo ${SYMBOL_MAX} caracteres.`
    if (charLength(about.trim()) > ABOUT_MAX) next.about = `Máximo ${ABOUT_MAX} caracteres.`
    if (charLength(quote.trim()) > QUOTE_MAX) next.quote = `Máximo ${QUOTE_MAX} caracteres.`
    if (charLength(contribution.trim()) > CONTRIBUTION_MAX) next.contribution = `Máximo ${CONTRIBUTION_MAX} caracteres.`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    let uploaded: string | null = null
    try {
      if (newPhoto) uploaded = await uploadImage('members', userId, newPhoto.img, setProgress)
      const photoPath = newPhoto ? uploaded : removePhoto ? null : member.photo_path
      const { error } = await supabase.rpc('save_member_profile', {
        p_member_id: member.id,
        p_symbol: symbol.trim(),
        p_about: about.trim(),
        p_quote: quote.trim(),
        p_contribution: contribution.trim(),
        p_photo_path: photoPath,
      })
      if (error) throw error
      // La foto anterior se borra solo si ya no se usa (si no es tuya, queda sin tocar).
      if (member.photo_path && member.photo_path !== photoPath) await dropFile('members', member.photo_path)
      await Promise.all([qc.invalidateQueries({ queryKey: ['members'] }), qc.invalidateQueries({ queryKey: ['admin', 'members'] }), qc.invalidateQueries({ queryKey: ['participation'] })])
      if (newPhoto) URL.revokeObjectURL(newPhoto.url)
      setNewPhoto(null)
      setRemovePhoto(false)
      toast('ok', 'Tu perfil quedó guardado.')
    } catch (e) {
      if (uploaded) await dropFile('members', uploaded)
      toast('error', friendlyError(e))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  const showPhoto = !removePhoto && (newPhoto || member.photo_path)
  const symbolValue = symbol.trim()

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--text)]">Mi perfil público</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Lo que escribas aquí lo puede leer cualquier visitante del portafolio. No pongas correo, teléfono ni redes sociales.
        </p>
      </div>

      <section aria-labelledby="perfil-foto" className="space-y-3">
        <h3 id="perfil-foto" className="text-sm font-medium text-[var(--text)]">
          Foto <span className="font-normal text-[var(--text-muted)]">(opcional · se recorta en círculo y se comprime a máx. 300 KB)</span>
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <span className="relative inline-block rounded-full" style={{ boxShadow: `0 0 0 3px ${tintOf(color, 55)}` }}>
            {newPhoto && showPhoto ? (
              <img src={newPhoto.url} alt="Vista previa de tu foto" width={88} height={88} className="h-[88px] w-[88px] rounded-full object-cover" />
            ) : (
              <Avatar name={member.name} photoPath={showPhoto ? member.photo_path : null} size={88} color={color} />
            )}
            <SymbolBadge symbol={symbolValue} color={color} size={30} className="absolute -bottom-1 -right-1" />
          </span>
          {showPhoto && (
            <Button
              variant="secondary"
              onClick={() => {
                if (newPhoto) URL.revokeObjectURL(newPhoto.url)
                setNewPhoto(null)
                setRemovePhoto(true)
              }}
            >
              <Trash2 size={15} aria-hidden /> Quitar foto
            </Button>
          )}
          {newPhoto && <p className="text-xs text-[var(--text-muted)]">Foto lista ({Math.max(1, Math.round(newPhoto.img.blob.size / 1024))} KB). Se publica al guardar.</p>}
        </div>
        <Dropzone accept="image/jpeg,image/png,image/webp" onFiles={onPhoto} label="Arrastra una foto o elígela" hint="JPG, PNG o WebP · se ajusta sola" disabled={processing || saving} />
        {processing && <p role="status" className="text-sm text-[var(--text-muted)]">Preparando la foto…</p>}
        {progress !== null && <p role="status" className="text-sm text-[var(--text-muted)]">Subiendo foto… {Math.round(progress * 100)} %</p>}
        {photoError && <p role="alert" className="text-sm text-red-500">{photoError}</p>}
      </section>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--text)]">
          Símbolo matemático favorito <span className="font-normal text-[var(--text-muted)]">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Símbolos sugeridos">
          {SYMBOL_SUGGESTIONS.map((s) => {
            const on = symbolValue === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setSymbol(on ? '' : s)}
                className="grid h-11 w-11 place-items-center rounded-xl border font-serif text-xl transition-colors"
                style={{ borderColor: on ? color : 'var(--border)', background: on ? tintOf(color, 22) : 'var(--card)', color: on ? inkOf(color) : 'var(--text)' }}
              >
                {s}
              </button>
            )
          })}
        </div>
        <label className="block text-sm text-[var(--text)]">
          O escribe el tuyo (máximo {SYMBOL_MAX} caracteres)
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            aria-invalid={!!errors.symbol}
            className={`mt-1 block w-28 rounded-xl border bg-[var(--card)] px-3 py-2.5 text-center font-serif text-xl text-[var(--text)] outline-none focus:border-gold ${errors.symbol ? 'border-red-500' : 'border-[var(--border)]'}`}
          />
        </label>
        {errors.symbol && <p role="alert" className="text-xs text-red-500">{errors.symbol}</p>}
        {!symbolValue && <p className="text-xs text-[var(--text-muted)]">Si no eliges ninguno, tu tarjeta no muestra insignia.</p>}
      </fieldset>

      <TextArea label={`Sobre mí (${charLength(about)}/${ABOUT_MAX})`} value={about} onChange={setAbout} rows={3} maxLength={ABOUT_MAX + 20} error={errors.about} hint="Una presentación corta: quién eres y qué te gusta de las matemáticas." />
      <TextArea label={`Frase o cita matemática favorita (${charLength(quote)}/${QUOTE_MAX})`} value={quote} onChange={setQuote} rows={2} maxLength={QUOTE_MAX + 20} error={errors.quote} hint="Opcional." />
      <TextArea label="Aporte principal al proyecto" value={contribution} onChange={setContribution} rows={4} maxLength={CONTRIBUTION_MAX + 20} error={errors.contribution} hint="Qué hiciste tú en este portafolio." />

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Button loading={saving} disabled={processing} onClick={save}>
          Guardar mi perfil
        </Button>
        <p className="text-xs text-[var(--text-muted)]">Tu nombre, tu rol y tu tema no se pueden cambiar desde aquí.</p>
      </div>
    </Card>
  )
}
