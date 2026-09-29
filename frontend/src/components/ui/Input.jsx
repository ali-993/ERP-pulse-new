import FieldLabel from './FieldLabel.jsx'

export default function Input({ label, error, id, className = '', required, optional, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      {label && <FieldLabel required={required} optional={optional}>{label}</FieldLabel>}
      <input
        id={id}
        required={required}
        className={`rounded-lg border px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none
          transition-colors placeholder:text-[var(--color-muted)]
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]
          ${error ? 'border-[var(--color-negative)]' : 'border-[var(--color-border)]'} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-[var(--color-negative)]">{error}</span>}
    </label>
  )
}
