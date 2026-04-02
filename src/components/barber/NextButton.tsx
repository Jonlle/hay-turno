import { SkipForward, Check, Minus } from 'lucide-react';

interface NextButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isPending: boolean;
  hasCurrentTurn: boolean;
  hasWaitingTurns: boolean;
}

export function NextButton({
  onClick,
  isDisabled,
  isPending,
  hasCurrentTurn,
  hasWaitingTurns,
}: NextButtonProps) {
  const label = hasWaitingTurns
    ? 'Llamar siguiente'
    : hasCurrentTurn
      ? 'Finalizar turno'
      : 'Sin turnos';

  const Icon = hasWaitingTurns ? SkipForward : hasCurrentTurn ? Check : Minus;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isPending}
      className="ht-btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
      data-testid="next-button"
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      {isPending ? 'Procesando...' : label}
    </button>
  );
}
