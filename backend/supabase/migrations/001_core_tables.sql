-- Verdora 001 — core farmer tables
-- Run after creating a new Supabase project (Email auth enabled).
-- Safe to re-run: uses IF NOT EXISTS throughout.

create extension if not exists "uuid-ossp";

-- ─── USERS (linked to Supabase Auth) ───
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default 'Farmer',
  role text not null check (role in ('farmer', 'admin')),
  location text,
  latitude double precision,
  longitude double precision,
  farm_size text,
  farmer_type text check (farmer_type in ('small-scale', 'commercial')),
  crop_preferences jsonb not null default '[]'::jsonb,
  soil_type text,
  farming_methods jsonb not null default '[]'::jsonb,
  data_consent boolean not null default false,
  data_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_location on public.users (location);

-- ─── FIELDS (before crops/scans — they reference field_id) ───
create table if not exists public.fields (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_fields_user_id on public.fields (user_id);

-- ─── CROPS ───
create table if not exists public.crops (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  crop_name text not null,
  plant_date date not null,
  harvest_date date,
  location text,
  field_name text,
  field_id text references public.fields (id) on delete set null,
  soil_type text,
  farming_methods jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crops_user_id on public.crops (user_id);
create index if not exists idx_crops_crop_name on public.crops (crop_name);
create index if not exists idx_crops_plant_date on public.crops (plant_date);

-- ─── SCANS ───
create table if not exists public.scans (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  image_url text,
  crop_type text not null,
  disease text,
  confidence double precision not null default 0,
  treatment text,
  location text,
  field_id text references public.fields (id) on delete set null,
  field_name text,
  latitude double precision,
  longitude double precision,
  scanned_at timestamptz not null default now()
);

create index if not exists idx_scans_user_id on public.scans (user_id);
create index if not exists idx_scans_disease on public.scans (disease);
create index if not exists idx_scans_scanned_at on public.scans (scanned_at desc);
create index if not exists idx_scans_disease_geo on public.scans (disease, scanned_at desc)
  where disease is not null and latitude is not null and longitude is not null;

-- ─── WEATHER_LOGS ───
create table if not exists public.weather_logs (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  location text not null,
  temperature double precision not null,
  humidity double precision not null,
  condition text not null,
  recommendation_shown text,
  rainfall_mm double precision,
  logged_at timestamptz not null default now()
);

create index if not exists idx_weather_logs_user_id on public.weather_logs (user_id);
create index if not exists idx_weather_logs_logged_at on public.weather_logs (logged_at desc);

-- ─── CHAT_LOGS ───
create table if not exists public.chat_logs (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  location text,
  question text not null,
  ai_response text,
  asked_at timestamptz not null default now()
);

create index if not exists idx_chat_logs_user_id on public.chat_logs (user_id);
create index if not exists idx_chat_logs_asked_at on public.chat_logs (asked_at desc);
