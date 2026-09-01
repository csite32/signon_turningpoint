-- ============================================================================
-- schema.sql — REFERENCE ONLY. Not executed automatically by anything in this
-- repo, not run against the live Supabase project. Written to document the
-- exact schema/RLS/storage design the mock services layer (src/services/*)
-- is shaped to match once a real Supabase-backed implementation replaces
-- src/services/mock/*.mock.ts.
--
-- Confirmed against the LIVE project's current schema (src/integrations/
-- supabase/types.ts) before writing this file:
--   - Tables that ALREADY exist today: `editor_overrides`, `user_roles`.
--   - `user_roles.role` uses an existing enum `app_role` that currently has
--     ONLY the value 'admin' — adding 'editor' is a real schema change,
--     included below, NOT applied yet.
--   - A `has_role(_user_id, _role)` SECURITY DEFINER function already
--     exists — reused below in every new RLS policy instead of a duplicate
--     helper.
--   - There is NO `profiles` table yet — added below.
--
-- Explicitly excluded, per instruction: no `service_role` key anywhere, no
-- passwords or API keys, no `insert into auth.users` (the first real admin
-- account is created by actually signing up through Supabase Auth, then
-- given an `admin` row in `user_roles` — never seeded here).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Schema change to the EXISTING `app_role` enum (not applied yet)
-- ---------------------------------------------------------------------------
-- alter type app_role add value 'editor';

-- ---------------------------------------------------------------------------
-- 1. profiles — mirrors auth.users for the columns the client is allowed to
--    read directly (auth.users itself is never queryable from client code).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Populated by a trigger on auth.users insert in the real project — a
-- template, not applied here (no auth.users row exists to attach it to yet):
--
-- create function public.handle_new_user() returns trigger
--   language plpgsql security definer set search_path = public as $$
-- begin
--   insert into public.profiles (id, email) values (new.id, new.email);
--   return new;
-- end; $$;
-- create trigger on_auth_user_created after insert on auth.users
--   for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  hero_image_path text,
  hero_image_url text,
  hero_image_alt text,
  tagline text,
  challenge_text text,
  solution_text text,
  subtitle text,
  extra_paragraph text,
  result_text text,
  testimonial_text text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_idx on public.projects (status);

-- ---------------------------------------------------------------------------
-- 3. project_images
-- ---------------------------------------------------------------------------
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  gallery_type text not null check (gallery_type in ('main_gallery', 'brand_colors', 'secondary_gallery')),
  storage_path text not null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_images_project_gallery_idx
  on public.project_images (project_id, gallery_type, sort_order);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger (reused across profiles + projects)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. RLS — reuses the EXISTING has_role(_user_id, _role) function.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;

-- profiles: a user can read their own row; only admins manage others'.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_admin_write" on public.profiles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- projects: public can read only published rows; admin/editor read+write all.
create policy "projects_public_read_published" on public.projects
  for select using (status = 'published');
create policy "projects_staff_read_all" on public.projects
  for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "projects_staff_write" on public.projects
  for insert with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "projects_staff_update" on public.projects
  for update using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "projects_staff_delete" on public.projects
  for delete using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- project_images: same published/staff split, joined through the parent project.
create policy "project_images_public_read_published" on public.project_images
  for select using (exists (
    select 1 from public.projects p where p.id = project_images.project_id and p.status = 'published'
  ));
create policy "project_images_staff_all" on public.project_images
  for all using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

-- user_roles: only admin manages role rows (existing table — extending its
-- policy set, not redefining the table).
-- create policy "user_roles_admin_write" on public.user_roles
--   for all using (public.has_role(auth.uid(), 'admin'))
--   with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 6. Storage — `project-media` bucket
-- ---------------------------------------------------------------------------
-- IMPORTANT (this is the part the previous draft of this file got wrong): a
-- bucket marked public=true in Supabase Storage serves ANY object to ANY
-- request that has its URL, with NO RLS check at all — so "public bucket" +
-- "block draft images" are mutually exclusive if the bucket itself is public.
-- The bucket below is created PRIVATE; public read access is granted only to
-- files that belong to a published project, via an RLS policy on
-- storage.objects that joins back to project_images/projects. Because the
-- bucket is private, `getPublicUrl()` does not work for anonymous visitors —
-- the public site must request a signed URL (e.g. from a TanStack Start
-- server function using the anon key, so this exact RLS still applies) for a
-- published project's images.
--
-- insert into storage.buckets (id, name, public) values ('project-media', 'project-media', false)
--   on conflict (id) do nothing;
--
-- create policy "project_media_staff_all" on storage.objects
--   for all using (
--     bucket_id = 'project-media'
--     and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
--   )
--   with check (
--     bucket_id = 'project-media'
--     and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
--   );
--
-- create policy "project_media_public_read_published" on storage.objects
--   for select using (
--     bucket_id = 'project-media'
--     and exists (
--       select 1 from public.project_images pi
--       join public.projects p on p.id = pi.project_id
--       where pi.storage_path = storage.objects.name and p.status = 'published'
--     )
--   );
--
-- Simpler alternative (documented, not the default): two buckets instead of
-- one — `project-media-public` (bucket public=true, contains ONLY files that
-- belong to already-published projects) and `project-media-drafts` (private,
-- admin/editor only). `publishProject()` would copy/move that project's files
-- from the drafts bucket into the public one. Avoids signed URLs entirely, at
-- the cost of keeping two copies in sync — a real tradeoff, not a strictly
-- better option than the private-bucket-with-RLS design above.
