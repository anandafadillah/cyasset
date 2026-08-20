export function PublicPanel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {title && <h3 className="mb-3.5 text-sm font-semibold text-text">{title}</h3>}
      {children}
    </div>
  );
}

export function PublicField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-0.5 text-[11px] text-dim">{label}</div>
      <div className="text-sm text-text">{value}</div>
    </div>
  );
}

export function PublicBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "good" | "warn" | "danger" | "accent";
}) {
  const toneClass = {
    muted: "bg-surface-3 text-muted",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{label}</span>;
}
