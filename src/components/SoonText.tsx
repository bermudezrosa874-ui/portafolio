import { Sparkles } from 'lucide-react'

/** ¿Es un texto de espera («Próximamente», «Muy pronto…») y no contenido real? */
export const isSoon = (text: string | null | undefined) => !!text && /^\s*(próximamente|muy pronto|la actividad de esta fase se publicará muy pronto|fechas por confirmar)/i.test(text)

/** Muestra el contenido tal cual; si es un texto de espera, lo muestra destacado con un destello dorado. */
export function SoonText({ value }: { value: string | null | undefined }) {
  if (!isSoon(value)) return <>{value}</>
  return (
    <span className="inline-flex items-start gap-1.5 font-medium italic text-gold">
      <Sparkles size={14} aria-hidden className="mt-1 shrink-0" />
      <span>{value}</span>
    </span>
  )
}
