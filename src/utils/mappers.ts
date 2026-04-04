import type { Database } from '../types/database';
import type { TurnItem } from '../types';

type TurnRow = Database['public']['Tables']['turns']['Row'];

/**
 * Map a database TurnRow to the UI-facing TurnItem type.
 */
export function mapTurnRow(row: TurnRow): TurnItem {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    turnNumber: row.turn_number,
    clientName: row.client_name,
    source: row.source as TurnItem['source'],
    status: row.status as TurnItem['status'],
    joinedAt: row.joined_at,
    calledAt: row.called_at,
  };
}
