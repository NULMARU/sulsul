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
  showCount = false,
}: {
  total: number;
  current: number;
  showCount?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={`${current + 1} / ${total}`}>
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
      {showCount && (
        <span className="text-xs text-text-muted tabular-nums">
          {current + 1}/{total}
        </span>
      )}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 44,
  thickness = 4,
  children,
}: {
  value: number; // 0..1
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const v = Math.max(0, Math.min(1, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - v);
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-accent transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
          {children}
        </div>
      )}
    </div>
  );
}
