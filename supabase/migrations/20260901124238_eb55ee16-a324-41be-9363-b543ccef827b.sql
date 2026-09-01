create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor')
$$;

alter table public.user_roles drop constraint if exists user_roles_user_id_role_key;
alter table public.user_roles add  constraint user_roles_user_id_key unique (user_id);

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
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_idx      on public.projects (status);
create index if not exists projects_status_sort_idx on public.projects (status, sort_order);
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  gallery_type text not null check (gallery_type in ('main_gallery','brand_colors','secondary_gallery')),
  storage_path text not null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_images_pgs_idx on public.project_images (project_id, gallery_type, sort_order);

grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
grant select on public.project_images to anon;
grant select, insert, update, delete on public.project_images to authenticated;
grant all on public.project_images to service_role;

alter table public.projects       enable row level security;
alter table public.project_images enable row level security;

create policy "projects_public_read_published" on public.projects
  for select using (status = 'published');
create policy "projects_staff_read_all" on public.projects
  for select using (public.is_staff());
create policy "projects_staff_insert" on public.projects
  for insert with check (public.is_staff());
create policy "projects_staff_update" on public.projects
  for update using (public.is_staff()) with check (public.is_staff());
create policy "projects_staff_delete" on public.projects
  for delete using (public.is_staff());

create policy "pi_public_read_published" on public.project_images
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_images.project_id and p.status = 'published')
  );
create policy "pi_staff_all" on public.project_images
  for all using (public.is_staff()) with check (public.is_staff());