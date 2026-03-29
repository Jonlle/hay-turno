export interface TurnItem {
  id: string;
  barbershopId: string;
  turnNumber: number;
  clientName: string;
  source: 'walk-in' | 'remote';
  status: 'waiting' | 'called' | 'attended' | 'cancelled';
  joinedAt: string;
  calledAt: string | null;
}

export interface QueueState {
  barbershopName: string;
  barbershopSlug: string;
  currentCalled: TurnItem | null;
  waitingTurns: TurnItem[];
}

export type StatsRange = 'day' | 'week' | 'month';
