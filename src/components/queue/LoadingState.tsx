import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-3"
      data-testid="loading-state"
    >
      <Loader2 className="w-8 h-8 animate-spin text-[var(--ht-primary)]" />
      <p className="text-sm text-gray-500">Cargando...</p>
    </div>
  );
}
