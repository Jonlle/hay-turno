CREATE OR REPLACE FUNCTION public.allocate_turn(
  target_barbershop_id UUID,
  new_source TEXT,
  new_client_name TEXT,
  new_membership_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_turn_num INT;
  new_turn JSONB;
BEGIN
  -- Atomic allocation: calculate next number and insert in one transaction
  SELECT COALESCE(MAX(turn_number), 0) + 1
  INTO next_turn_num
  FROM public.turns
  WHERE barbershop_id = target_barbershop_id;

  INSERT INTO public.turns (
    barbershop_id,
    turn_number,
    client_name,
    source,
    status,
    created_by_membership_id
  ) VALUES (
    target_barbershop_id,
    next_turn_num,
    new_client_name,
    new_source,
    'waiting',
    new_membership_id
  )
  RETURNING row_to_json(turns.*) INTO new_turn;

  RETURN new_turn;
END;
$$;

GRANT EXECUTE ON FUNCTION public.allocate_turn(UUID, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.allocate_turn(UUID, TEXT, TEXT, UUID) TO authenticated;
