-- 0003_next_rpc.sql
-- Race-safe Next operation for queue advancement
-- Returns affected turns (previous waiting/called that became attended, new called)

-- Drop existing function if exists
drop function if exists public.next_turn(uuid);

-- next_turn: Advances the queue for one barbershop_id
-- Uses DB-owned transaction to prevent race conditions
-- Returns JSON with { previous_turn_id, new_called_turn_id, affected_turns }
create or replace function public.next_turn(target_barbershop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_called_turn_id uuid := null;
  next_waiting_turn_id uuid := null;
  now_ts timestamptz := timezone('utc', now());
  result jsonb;
begin
  -- Find the currently called turn (if any)
  select t.id into current_called_turn_id
  from public.turns t
  where t.barbershop_id = target_barbershop_id
    and t.status = 'called'
  order by t.turn_number asc
  limit 1;

  -- Find the next waiting turn
  select t.id into next_waiting_turn_id
  from public.turns t
  where t.barbershop_id = target_barbershop_id
    and t.status = 'waiting'
  order by t.turn_number asc
  limit 1;

  -- Transaction-safely handle the state transitions
  -- Step 1: Mark current called turn as attended (if exists)
  if current_called_turn_id is not null then
    update public.turns
    set status = 'attended',
        completed_at = now_ts
    where id = current_called_turn_id
      and status = 'called';  -- Double-check status hasn't changed
  end if;

  -- Step 2: Mark next waiting turn as called (if exists)
  if next_waiting_turn_id is not null then
    update public.turns
    set status = 'called',
        called_at = now_ts
    where id = next_waiting_turn_id
      and status = 'waiting';  -- Double-check status hasn't changed
  end if;

  -- Build result JSON with all affected turns
  result := jsonb_build_object(
    'previous_turn_id', current_called_turn_id,
    'new_called_turn_id', next_waiting_turn_id,
    'affected_turns', (
      select coalesce(jsonb_agg(t.id), '[]'::jsonb)
      from public.turns t
      where t.barbershop_id = target_barbershop_id
        and (
          (t.id = current_called_turn_id and t.status = 'attended')
          or (t.id = next_waiting_turn_id and t.status = 'called')
        )
    )
  );

  return result;
end;
$$;

-- Grant execute to authenticated for admin operations
grant execute on function public.next_turn(uuid) to authenticated;

-- Optional: Also grant to service role if needed for migrations
grant execute on function public.next_turn(uuid) to service_role;