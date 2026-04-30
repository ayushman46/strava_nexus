create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  strava_athlete_id bigint unique not null,
  full_name text,
  username text,
  avatar_url text,
  city text,
  country text,
  sex text,
  weight numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text unique not null,
  owner_id uuid references profiles(id),
  is_public boolean default false,
  created_at timestamp default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamp default now(),
  unique (group_id, profile_id)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  strava_activity_id bigint unique not null,
  name text,
  type text,
  distance_m numeric not null,
  moving_time_sec integer not null,
  elapsed_time_sec integer,
  total_elevation_gain numeric default 0,
  average_speed numeric,
  max_speed numeric,
  average_heartrate numeric,
  max_heartrate numeric,
  start_date timestamp not null,
  timezone text,
  kudos_count integer default 0,
  achievement_count integer default 0,
  synced_at timestamp default now()
);

create table if not exists activity_scores (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  distance_points numeric default 0,
  pace_points numeric default 0,
  elevation_points numeric default 0,
  bonus_points numeric default 0,
  total_points numeric not null,
  calculated_at timestamp default now()
);

create table if not exists strava_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists ai_coach_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id),
  period_label text,
  prompt_version text,
  input_summary jsonb,
  input_summary_hash text,
  ai_output text,
  created_at timestamp default now()
);

create index if not exists idx_activities_profile_id on activities(profile_id);
create index if not exists idx_activities_start_date on activities(start_date desc);
create index if not exists idx_group_members_group_id on group_members(group_id);
create index if not exists idx_group_members_profile_id on group_members(profile_id);
create index if not exists idx_activity_scores_activity_id on activity_scores(activity_id);
create index if not exists idx_groups_invite_code on groups(invite_code);
create index if not exists idx_strava_tokens_profile_id on strava_tokens(profile_id);

create unique index if not exists idx_strava_tokens_profile_unique on strava_tokens(profile_id);
