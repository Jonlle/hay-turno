create or replace function public.is_barbershop_member(target_barbershop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.barbershop_memberships memberships
    where memberships.barbershop_id = target_barbershop_id
      and memberships.profile_id = (select auth.uid())
      and memberships.role in ('owner', 'manager')
  );
$$;

grant execute on function public.is_barbershop_member(uuid) to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.barbershops to anon, authenticated;
grant select on public.turns to anon, authenticated;
grant insert on public.turns to anon, authenticated;
grant update on public.turns to authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.barbershop_memberships to authenticated;

alter table public.barbershops enable row level security;
alter table public.profiles enable row level security;
alter table public.barbershop_memberships enable row level security;
alter table public.turns enable row level security;

drop policy if exists "Public Queue reads active barbershops" on public.barbershops;
create policy "Public Queue reads active barbershops"
on public.barbershops
for select
to public
using (is_active = true);

drop policy if exists "Admins read their barbershop profile" on public.profiles;
create policy "Admins read their barbershop profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Admins update their own profile" on public.profiles;
create policy "Admins update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Admins read memberships for their barbershop" on public.barbershop_memberships;
create policy "Admins read memberships for their barbershop"
on public.barbershop_memberships
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.is_barbershop_member(barbershop_id))
);

drop policy if exists "Public Queue reads waiting and called turns" on public.turns;
create policy "Public Queue reads waiting and called turns"
on public.turns
for select
to public
using (
  status in ('waiting', 'called')
  and exists (
    select 1
    from public.barbershops barbershop
    where barbershop.id = turns.barbershop_id
      and barbershop.is_active = true
  )
);

drop policy if exists "Remote clients create waiting turns" on public.turns;
create policy "Remote clients create waiting turns"
on public.turns
for insert
to public
with check (
  source = 'remote'
  and status = 'waiting'
  and created_by_membership_id is null
  and called_at is null
  and completed_at is null
  and cancelled_at is null
  and exists (
    select 1
    from public.barbershops barbershop
    where barbershop.id = turns.barbershop_id
      and barbershop.is_active = true
  )
);

drop policy if exists "Admins read all turns for their barbershop" on public.turns;
create policy "Admins read all turns for their barbershop"
on public.turns
for select
to authenticated
using ((select public.is_barbershop_member(barbershop_id)));

drop policy if exists "Admins create turns for their barbershop" on public.turns;
create policy "Admins create turns for their barbershop"
on public.turns
for insert
to authenticated
with check ((select public.is_barbershop_member(barbershop_id)));

drop policy if exists "Admins update turns for their barbershop" on public.turns;
create policy "Admins update turns for their barbershop"
on public.turns
for update
to authenticated
using ((select public.is_barbershop_member(barbershop_id)))
with check ((select public.is_barbershop_member(barbershop_id)));
