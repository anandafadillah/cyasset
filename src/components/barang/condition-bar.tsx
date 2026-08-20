export function ConditionBar({
  baik,
  rusakRingan,
  rusakBerat,
}: {
  baik: number;
  rusakRingan: number;
  rusakBerat: number;
}) {
  const total = baik + rusakRingan + rusakBerat || 1;

  return (
    <div className="min-w-32">
      <div className="mb-1 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
        {baik > 0 && <span className="bg-good" style={{ width: `${(baik / total) * 100}%` }} />}
        {rusakRingan > 0 && <span className="bg-warn" style={{ width: `${(rusakRingan / total) * 100}%` }} />}
        {rusakBerat > 0 && <span className="bg-danger" style={{ width: `${(rusakBerat / total) * 100}%` }} />}
      </div>
      <div className="text-[11px] text-muted">
        {baik} · {rusakRingan} · {rusakBerat}
      </div>
    </div>
  );
}
