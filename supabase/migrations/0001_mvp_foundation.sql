create extension if not exists pgcrypto;

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  timezone text not null default 'America/Bogota',
  theme_settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint barbershops_slug_format_check check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint barbershops_name_not_blank_check check (btrim(name) <> ''),
  constraint barbershops_timezone_not_blank_check check (btrim(timezone) <> ''),
  constraint barbershops_theme_settings_is_object_check check (jsonb_typeof(theme_settings) = 'object')
);

create unique index if not exists barbershops_slug_key on public.barbershops (slug);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_not_blank_check check (full_name is null or btrim(full_name) <> '')
);

create table if not exists public.barbershop_memberships (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint barbershop_memberships_role_check check (role in ('owner', 'manager')),
  constraint barbershop_memberships_unique_member_per_shop unique (barbershop_id, profile_id)
);

create index if not exists barbershop_memberships_barbershop_id_idx
  on public.barbershop_memberships (barbershop_id);

create index if not exists barbershop_memberships_profile_id_idx
  on public.barbershop_memberships (profile_id);

create index if not exists barbershop_memberships_profile_barbershop_idx
  on public.barbershop_memberships (profile_id, barbershop_id);

create table if not exists public.turns (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  turn_number integer not null,
  client_name text not null,
  source text not null,
  status text not null default 'waiting',
  joined_at timestamptz not null default timezone('utc', now()),
  called_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by_membership_id uuid references public.barbershop_memberships (id) on delete set null,
  constraint turns_client_name_not_blank_check check (btrim(client_name) <> ''),
  constraint turns_turn_number_positive_check check (turn_number > 0),
  constraint turns_source_check check (source in ('walk-in', 'remote')),
  constraint turns_status_check check (status in ('waiting', 'called', 'attended', 'cancelled')),
  constraint turns_turn_number_per_barbershop_unique unique (barbershop_id, turn_number),
  constraint turns_created_by_membership_required_for_walk_in_check check (
    source <> 'walk-in' or created_by_membership_id is not null
  ),
  constraint turns_remote_has_no_creator_check check (
    source <> 'remote' or created_by_membership_id is null
  ),
  constraint turns_called_requires_called_at_check check (
    status <> 'called' or called_at is not null
  ),
  constraint turns_attended_requires_timestamps_check check (
    status <> 'attended' or (called_at is not null and completed_at is not null and cancelled_at is null)
  ),
  constraint turns_cancelled_requires_cancelled_at_check check (
    status <> 'cancelled' or cancelled_at is not null
  ),
  constraint turns_waiting_has_no_terminal_timestamps_check check (
    status <> 'waiting' or (called_at is null and completed_at is null and cancelled_at is null)
  ),
  constraint turns_completed_after_joined_check check (
    completed_at is null or completed_at >= joined_at
  ),
  constraint turns_called_after_joined_check check (
    called_at is null or called_at >= joined_at
  ),
  constraint turns_cancelled_after_joined_check check (
    cancelled_at is null or cancelled_at >= joined_at
  )
);

create index if not exists turns_barbershop_id_idx
  on public.turns (barbershop_id);

create index if not exists turns_created_by_membership_id_idx
  on public.turns (created_by_membership_id);

create index if not exists turns_queue_lookup_idx
  on public.turns (barbershop_id, status, turn_number)
  where status in ('waiting', 'called');

create index if not exists turns_status_joined_idx
  on public.turns (barbershop_id, status, joined_at);

create index if not exists turns_attended_stats_idx
  on public.turns (barbershop_id, completed_at)
  where status = 'attended';
