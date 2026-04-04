import { getSupabaseBrowserClient } from './client';
import type { Database } from '../../types/database';
import { remoteTurnSchema, walkInTurnSchema, turnRecordSchema } from '../../schemas/turn';
import type { TurnRecord } from '../../schemas/turn';

type TurnRow = Database['public']['Tables']['turns']['Row'];
type TurnInsert = Database['public']['Tables']['turns']['Insert'];

/**
 * Response type for next_turn RPC function
 */
export interface NextTurnResult {
  previous_turn_id: string | null;
  new_called_turn_id: string | null;
  affected_turns: string[];
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

  return data ?? [];
}

/**
 * Join the queue as a remote client.
 * The client_name is validated by the Zod schema before sending.
 */
export async function joinQueueRemote(
  barbershopId: string,
  clientName: string
): Promise<TurnRow> {
  const validated = remoteTurnSchema.parse({ clientName });

  const supabase = getSupabaseBrowserClient();

  // Get the next turn number for this barbershop
  const { data: lastTurn } = await supabase
    .from('turns')
    .select('turn_number')
    .eq('barbershop_id', barbershopId)
    .order('turn_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextTurnNumber = (lastTurn?.turn_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('turns')
    .insert({
      barbershop_id: barbershopId,
      turn_number: nextTurnNumber,
      client_name: validated.clientName,
      source: 'remote',
      status: 'waiting',
    } satisfies TurnInsert)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create remote turn - no data returned');
  }

  return data;
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
  const validated = walkInTurnSchema.parse({ clientName });

  const supabase = getSupabaseBrowserClient();

  // Get the next turn number for this barbershop
  const { data: lastTurn } = await supabase
    .from('turns')
    .select('turn_number')
    .eq('barbershop_id', barbershopId)
    .order('turn_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextTurnNumber = (lastTurn?.turn_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('turns')
    .insert({
      barbershop_id: barbershopId,
      turn_number: nextTurnNumber,
      client_name: validated.clientName,
      source: 'walk-in',
      status: 'waiting',
      created_by_membership_id: membershipId,
    } satisfies TurnInsert)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create walk-in turn - no data returned');
  }

  return data;
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
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Next turn RPC returned no data');
  }

  const result = data as unknown as NextTurnResult;
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

  const { data, error } = await supabase
    .from('turns')
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

  return data;
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

  return data;
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
