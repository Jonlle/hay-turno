import { SkipForward } from 'lucide-react';

interface NextButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isPending: boolean;
  hasWaitingTurns: boolean;
}

export function NextButton({
  onClick,
  isDisabled,
  isPending,
  hasWaitingTurns,
}: NextButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isPending || !hasWaitingTurns}
      className="ht-btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
      data-testid="next-button"
      aria-label="Siguiente turno"
    >
      <SkipForward className="w-5 h-5" />
      {isPending ? 'Avanzando...' : 'Siguiente'}
    </button>
  );
}
