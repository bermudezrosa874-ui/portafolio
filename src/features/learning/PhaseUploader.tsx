import { useRef, useState, type DragEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { extensionFor, validateDocument } from '../../lib/fileValidation'
import { removeObject, uploadWithProgress } from '../../lib/upload'
import type { Deliverable } from '../../types'

interface Props {
  phaseId: number
  existing: Deliverable | undefined
  userId: string
  userName: string | null
}

const cleanName = (name: string) => name.replace(/[\\/]/g, '_').slice(0, 120)

/** Se muestra a Rosa y a los colaboradores (con las reglas de la base). Valida el tipo real, renombra con UUID y muestra progreso. */
export function PhaseUploader({ phaseId, existing, userId, userName }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const handleFile = async (file: File) => {
    setMessage(null)
    const check = await validateDocument(file)
    if (!check.ok) {
      setMessage({ kind: 'error', text: check.error })
      return
    }

    const path = `fase-${phaseId}/${crypto.randomUUID()}.${extensionFor(check.mime)}`
    try {
      setProgress(0)
      await uploadWithProgress('deliverables', path, file, check.mime, setProgress)

      const { error } = await supabase.from('phase_deliverables').upsert(
        {
          phase_id: phaseId,
          file_path: path,
          file_name: cleanName(file.name),
          mime_type: check.mime,
          size_bytes: file.size,
          uploaded_by: userId,
          uploaded_by_name: userName,
          published: true,
        },
        { onConflict: 'phase_id' },
      )
      if (error) {
        await removeObject('deliverables', path).catch(() => undefined)
        throw error
      }
      if (existing) await removeObject('deliverables', existing.file_path).catch(() => undefined)

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['learning'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'phase_deliverables'] }),
      ])
      setMessage({ kind: 'ok', text: 'Documento subido correctamente.' })
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'No se pudo subir el archivo.' })
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const busy = progress !== null

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-gold">Modo edición</p>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
          dragging ? 'border-gold bg-gold/10' : 'border-[var(--border)]'
        }`}
      >
        <Upload className="mx-auto text-gold" size={26} aria-hidden />
        <p className="mt-2 text-sm text-[var(--text)]">Arrastra aquí un PDF o Word (.docx), máx. 20 MB</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-full bg-[#f5b942] px-5 py-2 text-sm font-semibold text-[#071426] disabled:opacity-50"
        >
          {existing ? 'Reemplazar documento' : 'Subir documento'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Elegir archivo de la entrega"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
      </div>

      {progress !== null && (
        <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-2 overflow-hidden rounded bg-[var(--border)]">
            <div className="h-full origin-left bg-gold transition-transform" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Subiendo… {Math.round(progress * 100)} %</p>
        </div>
      )}
      {message && (
        <p role="status" className={`mt-3 text-sm ${message.kind === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
