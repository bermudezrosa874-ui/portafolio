import { useRef, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  /** Atributo accept del input (solo orienta al selector; la validación real la hace el llamador). */
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label: string
  hint?: string
  disabled?: boolean
}

/** Zona para arrastrar y soltar archivos, o elegirlos con el teclado/selector. */
export function Dropzone({ accept, multiple, onFiles, label, hint, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
    if (inputRef.current) inputRef.current.value = ''
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!disabled) take(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        over ? 'border-gold bg-gold/10' : 'border-[var(--border)]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <Upload className="mx-auto text-gold" size={28} aria-hidden />
      <p className="mt-2 text-sm text-[var(--text)]">{label}</p>
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-3 rounded-full bg-[#f5b942] px-5 py-2 text-sm font-semibold text-[#071426] disabled:opacity-50"
      >
        {multiple ? 'Elegir archivos' : 'Elegir archivo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        aria-label={label}
        tabIndex={-1}
        onChange={(e) => take(e.target.files)}
      />
    </div>
  )
}
