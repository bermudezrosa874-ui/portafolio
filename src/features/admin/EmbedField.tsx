import { useState } from 'react'
import { CheckCircle2, ExternalLink, Info, XCircle } from 'lucide-react'
import { SafeFrame } from '../../components/SafeFrame'
import { TextField } from '../../components/ui/forms'
import { PLATFORM_LABEL, resolveEmbed } from '../../lib/embed'

/** Columnas derivadas del enlace que se guardan junto a él. */
export function deriveEmbed(url: string) {
  const info = resolveEmbed(url)
  return {
    embed_url: info.embedUrl,
    platform: info.valid ? PLATFORM_LABEL[info.platform] : null,
    thumbnail_url: info.thumbnail,
  }
}

/** Campo de enlace: detecta la plataforma, genera el formato incrustable y muestra vista previa. */
export function EmbedField({ label, url, onUrl, hint }: { label: string; url: string; onUrl: (v: string) => void; hint?: string }) {
  const [showPreview, setShowPreview] = useState(false)
  const info = resolveEmbed(url)
  const typed = url.trim().length > 0

  let status: { icon: typeof Info; tone: string; text: string } | null = null
  if (typed && !info.valid) {
    status = { icon: XCircle, tone: 'text-red-500', text: 'Pega un enlace completo que empiece por https:// (sin usuario ni contraseña).' }
  } else if (typed && !info.allowed) {
    status = {
      icon: Info,
      tone: 'text-[#f5b942]',
      text: 'Este sitio no está en la lista de dominios permitidos: se abrirá en una pestaña nueva y no se incrustará.',
    }
  } else if (typed && !info.embedUrl) {
    status = {
      icon: Info,
      tone: 'text-[#f5b942]',
      text: `Detectado: ${PLATFORM_LABEL[info.platform]}. Este enlace no tiene formato incrustable, así que se abrirá en una pestaña nueva. Si la plataforma ofrece la opción «Incrustar», pega ese enlace.`,
    }
  } else if (typed && info.embedUrl) {
    status = { icon: CheckCircle2, tone: 'text-emerald-500', text: `Detectado: ${PLATFORM_LABEL[info.platform]}. Se mostrará incrustado.` }
  }

  return (
    <div className="space-y-2">
      <TextField label={label} type="url" value={url} onChange={onUrl} hint={hint ?? 'YouTube, Vimeo, Drive, Docs, Canva, Genially, Prezi, OneDrive…'} required />
      {status && (
        <p className={`flex items-start gap-2 text-sm ${status.tone}`} role="status">
          <status.icon size={17} aria-hidden className="mt-0.5 shrink-0" /> {status.text}
        </p>
      )}
      {info.embedUrl && (
        <div>
          <button type="button" onClick={() => setShowPreview((s) => !s)} className="text-sm text-teal underline underline-offset-4">
            {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
          </button>
          {showPreview && (
            <div className="mt-2 aspect-video max-h-72 overflow-hidden rounded-xl border border-[var(--border)] bg-black">
              <SafeFrame src={info.embedUrl} title="Vista previa del enlace" />
            </div>
          )}
        </div>
      )}
      {info.valid && info.openUrl && (
        <a href={info.openUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal underline underline-offset-4">
          <ExternalLink size={14} aria-hidden /> Probar el enlace en una pestaña nueva
        </a>
      )}
    </div>
  )
}
