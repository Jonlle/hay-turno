import type { TurnRow } from '../services/supabase/queue';
import type { TurnItem } from '../types';

/**
 * Map a database TurnRow to the UI-facing TurnItem type.
 */
export function mapTurnRow(row: TurnRow): TurnItem {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    turnNumber: row.turn_number,
    clientName: row.client_name,
    source: row.source,
    status: row.status,
    joinedAt: row.joined_at,
    calledAt: row.called_at,
  };
}
