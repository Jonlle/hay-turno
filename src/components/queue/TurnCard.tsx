import type { TurnItem } from '../../types';
import { X } from 'lucide-react';

interface TurnCardProps {
  turn: TurnItem;
  isCurrent?: boolean;
  onCancel?: (turnId: string) => void;
}

export function TurnCard({ turn, isCurrent = false, onCancel }: TurnCardProps) {
  return (
    <div
      className={`ht-card flex items-center justify-between ${
        isCurrent ? 'border-l-4 border-l-[hsl(45_93%_47%)]' : ''
      }`}
      data-testid={`turn-card-${turn.id}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-(--ht-primary)">
          #{turn.turnNumber}
        </span>
        <div>
          <p className="font-medium text-sm">{turn.clientName}</p>
          <p className="text-xs text-gray-500">
            {turn.source === 'walk-in' ? 'Walk-in' : 'Remote'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            turn.status === 'called' ? 'ht-chip-called' : 'ht-chip-waiting'
          }
        >
          {turn.status === 'called' ? 'Atendiendo' : 'En espera'}
        </span>
        {onCancel && turn.status === 'waiting' && (
          <button
            onClick={() => onCancel(turn.id)}
            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
            aria-label={`Cancelar turno ${turn.turnNumber}`}
            data-testid={`cancel-turn-${turn.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
