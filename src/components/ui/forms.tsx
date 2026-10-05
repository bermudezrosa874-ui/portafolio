import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

const input =
  'mt-1 w-full rounded-xl border bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)]/70 focus:border-gold disabled:opacity-60'

const border = (error?: string) => (error ? 'border-red-500' : 'border-[var(--border)]')

interface BaseProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

function Wrap({ id, label, error, hint, required, children }: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text)]">
        {label}
        {required && <span aria-hidden className="text-red-500"> *</span>}
      </label>
      {children}
      {(error || hint) && (
        <p id={`${id}-info`} className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-[var(--text-muted)]'}`} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = 'text',
  maxLength,
  placeholder,
  autoComplete,
}: BaseProps & {
  value: string
  onChange: (v: string) => void
  type?: string
  maxLength?: number
  placeholder?: string
  autoComplete?: string
}) {
  const id = useId()
  return (
    <Wrap id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-info` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} ${border(error)}`}
      />
    </Wrap>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  rows = 4,
  maxLength,
}: BaseProps & { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number }) {
  const id = useId()
  return (
    <Wrap id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-info` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} ${border(error)}`}
      />
    </Wrap>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
}: BaseProps & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId()
  return (
    <Wrap id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        value={value}
        required={required}
        aria-describedby={error || hint ? `${id}-info` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} ${border(error)}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  )
}

/** Interruptor Publicado / Borrador. */
export function Toggle({
  checked,
  onChange,
  labelOn = 'Publicado',
  labelOff = 'Borrador',
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  labelOn?: string
  labelOff?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-10 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] py-1.5 pl-2 pr-4 text-sm text-[var(--text)] disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-500'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </span>
      {checked ? labelOn : labelOff}
    </button>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-[#f5b942] text-[#071426] hover:brightness-110',
  secondary: 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-[var(--text)] hover:bg-[var(--surface)]',
}

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    >
      {loading ? 'Guardando…' : children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}>{children}</div>
}

export function TabIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-3xl font-semibold text-gold">{title}</h2>
      {children && <div className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">{children}</div>}
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p
      className={`rounded-xl border-l-4 p-3.5 text-sm text-[var(--text)] ${
        tone === 'warn' ? 'border-[#f5b942] bg-[#f5b942]/10' : 'border-teal bg-teal/10'
      }`}
    >
      {children}
    </p>
  )
}
