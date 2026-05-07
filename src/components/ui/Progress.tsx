interface ProgressProps {
  value: number; // 0..1
  className?: string;
  thickness?: number;
}

export function Progress({ value, className = '', thickness = 8 }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`bg-border rounded-full overflow-hidden ${className}`}
      style={{ height: thickness }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-accent transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all ${
            i === current
              ? 'w-6 h-2 bg-accent'
              : i < current
                ? 'w-2 h-2 bg-accent/60'
                : 'w-2 h-2 bg-border'
          }`}
        />
      ))}
    </div>
  );
}
