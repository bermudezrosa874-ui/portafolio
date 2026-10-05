import { publicUrl } from '../lib/upload'

/** Iniciales sin los marcadores «[Por completar]». */
function initials(name: string): string {
  const words = name
    .replace(/\[[^\]]*\]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

interface Props {
  name: string
  photoPath: string | null
  size?: number
  className?: string
}

/** Foto del integrante o, si no hay, una imagen por defecto con sus iniciales. */
export function Avatar({ name, photoPath, size = 64, className = '' }: Props) {
  const shape = `shrink-0 rounded-full object-cover ${className}`
  if (photoPath) {
    return (
      <img
        src={publicUrl('members', photoPath)}
        alt={`Foto de ${name.replace(/\[[^\]]*\]/g, '').trim() || 'integrante'}`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={shape}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <svg
      role="img"
      aria-label={`Imagen por defecto de ${name.replace(/\[[^\]]*\]/g, '').trim() || 'integrante'}`}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={shape}
    >
      <defs>
        <linearGradient id="avatar-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#avatar-grad)" />
      <path d="M32 32 m0 0 c2-3 7-2 7 3 s-5 8-10 6 s-6-9-1-14 s14-4 17 3" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.4" />
      <text x="32" y="39" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="22" fontWeight="600" fill="#fff">
        {initials(name)}
      </text>
    </svg>
  )
}
