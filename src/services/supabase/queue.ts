import { getSupabaseBrowserClient } from './client';
import { remoteTurnSchema, walkInTurnSchema, turnRecordSchema } from '../../schemas/turn';
import type { TurnRecord } from '../../schemas/turn';

/**
 * Turn row from the database
 */
export interface TurnRow {
  id: string;
  barbershop_id: string;
  turn_number: number;
  client_name: string;
  source: 'walk-in' | 'remote';
  status: 'waiting' | 'called' | 'attended' | 'cancelled';
  joined_at: string;
  called_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_by_membership_id: string | null;
}

/**
 * Get the current queue for a barbershop (waiting and called turns).
 * Ordered by turn_number ascending.
 */
export async function getQueueForBarbershop(barbershopId: string): Promise<TurnRow[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('turns')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .in('status', ['waiting', 'called'])
    .order('turn_number', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TurnRow[];
}

/**
 * Join the queue as a remote client.
 * The client_name is validated by the Zod schema before sending.
 */
export async function joinQueueRemote(
  barbershopId: string,
  clientName: string
): Promise<TurnRow> {
  // Validate input using the schema
  const validated = remoteTurnSchema.parse({ clientName });

  const supabase = getSupabaseBrowserClient();

  // Get the next turn number for this barbershop
  const { data: lastTurn } = await (supabase.from('turns') as any)
    .select('turn_number')
    .eq('barbershop_id', barbershopId)
    .order('turn_number', { ascending: false })
    .limit(1)
    .single();

  const nextTurnNumber = ((lastTurn as any)?.turn_number ?? 0) + 1;

  const { data, error } = await (supabase.from('turns') as any)
    .insert({
      barbershop_id: barbershopId,
      turn_number: nextTurnNumber,
      client_name: validated.clientName,
      source: 'remote',
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create remote turn - no data returned');
  }

  return data as TurnRow;
}

/**
 * Create a walk-in turn (requires authenticated admin).
 * The client_name is validated and membership_id is attached.
 */
export async function createWalkInTurn(
  barbershopId: string,
  clientName: string,
  membershipId: string
): Promise<TurnRow> {
  // Validate input using the schema
  const validated = walkInTurnSchema.parse({ clientName });

  const supabase = getSupabaseBrowserClient();

  // Get the next turn number for this barbershop
  const { data: lastTurn } = await (supabase.from('turns') as any)
    .select('turn_number')
    .eq('barbershop_id', barbershopId)
    .order('turn_number', { ascending: false })
    .limit(1)
    .single();

  const nextTurnNumber = ((lastTurn as any)?.turn_number ?? 0) + 1;

  const { data, error } = await (supabase.from('turns') as any)
    .insert({
      barbershop_id: barbershopId,
      turn_number: nextTurnNumber,
      client_name: validated.clientName,
      source: 'walk-in',
      status: 'waiting',
      created_by_membership_id: membershipId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create walk-in turn - no data returned');
  }

  return data as TurnRow;
}

/**
 * Response type for next_turn RPC function
 */
export interface NextTurnResult {
  previous_turn_id: string | null;
  new_called_turn_id: string | null;
  affected_turns: string[];
}

/**
 * Call the next turn in the queue - uses the DB-owned RPC for race-safe operation.
 * Returns the result from the Next function.
 */
export async function callNextTurn(barbershopId: string): Promise<{
  previousTurnId: string | null;
  newCalledTurnId: string | null;
  affectedTurnIds: string[];
}> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.rpc('next_turn', {
    target_barbershop_id: barbershopId,
  } as any);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Next turn RPC returned no data');
  }

  const result = data as NextTurnResult;
  return {
    previousTurnId: result.previous_turn_id,
    newCalledTurnId: result.new_called_turn_id,
    affectedTurnIds: result.affected_turns ?? [],
  };
}

/**
 * Cancel a turn (mark as cancelled).
 */
export async function cancelTurn(turnId: string): Promise<TurnRow> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await (supabase.from('turns') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', turnId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TurnRow;
}

/**
 * Get a single turn by ID.
 */
export async function getTurnById(turnId: string): Promise<TurnRow | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('turns')
    .select('*')
    .eq('id', turnId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as TurnRow;
}

/**
 * Validate a turn record against the schema.
 */
export function validateTurnRecord(turn: unknown): TurnRecord[] {
  if (Array.isArray(turn)) {
    return turn.map((t) => turnRecordSchema.parse(t));
  }
  return [turnRecordSchema.parse(turn)];
}