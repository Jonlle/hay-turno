import type { TurnItem } from '../../types';

interface TurnCardProps {
  turn: TurnItem;
  isCurrent?: boolean;
}

export function TurnCard({ turn, isCurrent = false }: TurnCardProps) {
  return (
    <div
      className={`ht-card flex items-center justify-between ${
        isCurrent ? 'border-l-4 border-l-[hsl(45_93%_47%)]' : ''
      }`}
      data-testid={`turn-card-${turn.id}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-[var(--ht-primary)]">
          #{turn.turnNumber}
        </span>
        <div>
          <p className="font-medium text-sm">{turn.clientName}</p>
          <p className="text-xs text-gray-500">
            {turn.source === 'walk-in' ? 'Walk-in' : 'Remote'}
          </p>
        </div>
      </div>
      <span
        className={
          turn.status === 'called' ? 'ht-chip-called' : 'ht-chip-waiting'
        }
      >
        {turn.status === 'called' ? 'Llamando' : 'En espera'}
      </span>
    </div>
  );
}
