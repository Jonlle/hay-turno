import type { QueueState } from '../../types';
import { TurnCard } from './TurnCard';

interface QueueBoardProps {
  queueState: QueueState;
}

export function QueueBoard({ queueState }: QueueBoardProps) {
  const { currentCalled, waitingTurns } = queueState;

  return (
    <div className="space-y-4" data-testid="queue-board">
      {/* Currently being served */}
      {currentCalled ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Siendo atendido
          </h2>
          <TurnCard turn={currentCalled} isCurrent />
        </section>
      ) : (
        <section className="ht-card text-center py-6">
          <p className="text-gray-500 text-sm">Nadie siendo atendido</p>
        </section>
      )}

      {/* Waiting queue */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
          En espera ({waitingTurns.length})
        </h2>

        {waitingTurns.length === 0 ? (
          <div className="ht-card text-center py-6">
            <p className="text-gray-400 text-sm">Cola vacía</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingTurns.map((turn) => (
              <TurnCard key={turn.id} turn={turn} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
