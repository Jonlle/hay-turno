import type { StatsRange } from '../../types';

interface StatsRangeToggleProps {
  current: StatsRange;
  onChange: (range: StatsRange) => void;
}

const RANGES: { value: StatsRange; label: string }[] = [
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function StatsRangeToggle({
  current,
  onChange,
}: StatsRangeToggleProps) {
  return (
    <div
      className="ht-range-toggle"
      role="tablist"
      aria-label="Rango de estadísticas"
      data-testid="stats-range-toggle"
    >
      {RANGES.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={current === value}
          className={current === value ? 'active' : ''}
          onClick={() => onChange(value)}
          data-testid={`stats-range-${value}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
