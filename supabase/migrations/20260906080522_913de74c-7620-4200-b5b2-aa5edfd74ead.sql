create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('image','youtube')),
  image text,
  image_alt text,
  image_path text,
  youtube_url text,
  text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recommendations_sort_order_idx on public.recommendations (sort_order);

grant select on public.recommendations to anon;
grant select, insert, update, delete on public.recommendations to authenticated;
grant all on public.recommendations to service_role;

alter table public.recommendations enable row level security;

create policy "recommendations_public_read" on public.recommendations
  for select using (true);
create policy "recommendations_staff_insert" on public.recommendations
  for insert with check (public.is_staff());
create policy "recommendations_staff_update" on public.recommendations
  for update using (public.is_staff()) with check (public.is_staff());
create policy "recommendations_staff_delete" on public.recommendations
  for delete using (public.is_staff());

create trigger trg_recommendations_updated_at before update on public.recommendations
  for each row execute function public.set_updated_at();