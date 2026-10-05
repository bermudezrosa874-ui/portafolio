import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { z } from '../../../lib/zod'
import { Button, Card, Notice, TabIntro, TextArea, TextField, Toggle } from '../../../components/ui/forms'
import { SortableList } from '../../../components/ui/SortableList'
import { useConfirm } from '../../../components/ui/Confirm'
import { deleteRow, insertRow, persistOrder, updateRow, useAction, useAdminRows, useRefresh } from '../adminData'
import type { QuizQuestion } from '../../../types'

type Row = QuizQuestion & { published: boolean }

const schema = z
  .object({
    question: z.string().trim().min(1, 'Escribe la pregunta.').max(300, 'Máximo 300 caracteres.'),
    options: z.array(z.string().trim().min(1, 'Una opción está vacía.').max(150, 'Máximo 150 caracteres.')).min(2, 'Pon al menos 2 opciones.').max(6),
    correct: z.number().int().min(0),
    explanation: z.string().max(600),
    topic: z.string().max(80),
  })
  .refine((v) => v.correct < v.options.length, { message: 'Marca cuál es la respuesta correcta.', path: ['correct'] })

function QuestionForm({ initial, nextPosition, onClose }: { initial: Row | null; nextPosition: number; onClose: () => void }) {
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [options, setOptions] = useState<string[]>(initial?.options ?? ['', '', '', ''])
  const [correct, setCorrect] = useState(initial?.correct_index ?? 0)
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [topic, setTopic] = useState(initial?.topic ?? '')
  const [published, setPublished] = useState(initial?.published ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const removeOption = (i: number) => {
    setOptions((o) => o.filter((_, j) => j !== i))
    setCorrect((c) => (c === i ? 0 : c > i ? c - 1 : c))
  }

  const save = async () => {
    const parsed = schema.safeParse({ question, options, correct, explanation, topic })
    if (!parsed.success) {
      const e: Record<string, string> = {}
      for (const issue of parsed.error.issues) e[String(issue.path[0])] ??= issue.message
      return setErrors(e)
    }
    setErrors({})
    const v = parsed.data
    const payload = { question: v.question, options: v.options, correct_index: v.correct, explanation: v.explanation.trim(), topic: v.topic.trim() || null, published }
    const ok = await run(initial ? 'Pregunta actualizada.' : 'Pregunta agregada.', async () => {
      if (initial) await updateRow('quiz_questions', initial.id, payload)
      else await insertRow('quiz_questions', { ...payload, position: nextPosition })
      await refresh('quiz_questions')
      return true
    })
    if (ok) onClose()
  }

  return (
    <Card className="space-y-4 border-gold/40">
      <h3 className="font-serif text-2xl font-semibold text-[var(--text)]">{initial ? 'Editar pregunta' : 'Agregar pregunta'}</h3>
      <TextArea label="Pregunta" value={question} onChange={setQuestion} rows={2} error={errors.question} required maxLength={300} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--text)]">Opciones (marca la correcta)</legend>
        {options.map((o, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="mb-2.5 flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-[var(--text)]">
              <input type="radio" name="correcta" className="h-5 w-5 accent-[#f5b942]" checked={correct === i} onChange={() => setCorrect(i)} aria-label={`La opción ${i + 1} es la correcta`} />
            </label>
            <div className="flex-1">
              <TextField label={`Opción ${i + 1}`} value={o} onChange={(v) => setOptions((x) => x.map((y, j) => (j === i ? v : y)))} maxLength={150} />
            </div>
            <Button variant="secondary" className="mb-0.5 !px-3" disabled={options.length <= 2} onClick={() => removeOption(i)} aria-label={`Quitar la opción ${i + 1}`}>
              <Trash2 size={15} aria-hidden />
            </Button>
          </div>
        ))}
        {(errors.options || errors.correct) && <p role="alert" className="text-sm text-red-500">{errors.options ?? errors.correct}</p>}
        <Button variant="secondary" disabled={options.length >= 6} onClick={() => setOptions((o) => [...o, ''])}>
          <Plus size={15} aria-hidden /> Agregar opción
        </Button>
      </fieldset>

      <TextArea label="Explicación de la respuesta (se muestra al responder)" value={explanation} onChange={setExplanation} rows={2} maxLength={600} />
      <TextField label="Tema (opcional)" value={topic} onChange={setTopic} maxLength={80} hint="Por ejemplo: Egipto, Tales de Mileto…" />

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
        <Toggle checked={published} onChange={setPublished} />
        <Button loading={busy} onClick={save}>
          {initial ? 'Guardar cambios' : 'Agregar pregunta'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}

export default function QuizTab() {
  const { data: rows = [], isLoading } = useAdminRows<Row>('quiz_questions', [['position', true], ['created_at', true]])
  const confirm = useConfirm()
  const refresh = useRefresh()
  const { busy, run } = useAction()
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const remove = async (q: Row) => {
    const ok = await confirm({
      title: '¿Eliminar esta pregunta?',
      message: `Se eliminará «${q.question}». Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar pregunta',
      danger: true,
    })
    if (!ok) return
    await run('Pregunta eliminada.', async () => {
      await deleteRow('quiz_questions', q.id)
      await refresh('quiz_questions')
    })
  }

  return (
    <div className="space-y-5">
      <TabIntro title="Quiz «¿Quién lo dijo?»">Edita las preguntas del mini-quiz de la sección «Lo que aprendimos». Se muestran solo las publicadas.</TabIntro>

      {editing === null && (
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Agregar pregunta
        </Button>
      )}
      {editing !== null && <QuestionForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} nextPosition={Math.max(0, ...rows.map((r) => r.position)) + 1} onClose={() => setEditing(null)} />}

      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}
      {!isLoading && rows.length === 0 && <Notice>Aún no hay preguntas.</Notice>}

      <SortableList
        items={rows}
        nameOf={(q) => q.question}
        onReorder={(ids) =>
          run('Orden guardado.', async () => {
            await persistOrder('quiz_questions', ids)
            await refresh('quiz_questions')
          })
        }
        render={(q, i) => (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--text)]">
                <span className="text-[var(--text-muted)]">{i + 1}. </span>
                {q.question}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Correcta: {q.options[q.correct_index] ?? '—'} ·{' '}
                <span className={q.published ? 'text-emerald-500' : 'text-[#f5b942]'}>{q.published ? 'Publicada' : 'Borrador'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(q)} aria-label={`Editar la pregunta ${i + 1}`}>
                <Pencil size={15} aria-hidden /> Editar
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => remove(q)} aria-label={`Eliminar la pregunta ${i + 1}`}>
                <Trash2 size={15} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
