export default function FieldLabel({ children, required, optional }) {
  return (
    <span className="text-sm font-medium text-[var(--color-ink-soft)]">
      {children}
      {required && (
        <span className="ml-0.5 text-[var(--color-negative)]" aria-hidden="true">*</span>
      )}
      {optional && !required && (
        <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">Optional</span>
      )}
    </span>
  )
}