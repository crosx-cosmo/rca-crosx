create extension if not exists pgcrypto with schema extensions;

create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{3,40}$'),
  destination text not null check (destination ~* '^https?://' and length(destination) <= 2048),
  enabled boolean not null default true,
  clicks bigint not null default 0,
  last_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  owner_hash text not null
);
create index short_links_owner_idx on public.short_links (owner_hash);
grant all on public.short_links to service_role;
alter table public.short_links enable row level security;

create or replace function public._sl_hash(token text) returns text
language sql immutable set search_path = public, extensions as $$ select encode(extensions.digest(token, 'sha256'), 'hex') $$;

create or replace function public.create_short_link(p_slug text, p_destination text, p_owner text)
returns public.short_links language plpgsql security definer set search_path = public, extensions as $$
declare r public.short_links;
begin
  if length(coalesce(p_owner, '')) < 32 then raise exception 'invalid owner token'; end if;
  insert into short_links (slug, destination, owner_hash)
  values (p_slug, p_destination, public._sl_hash(p_owner)) returning * into r;
  r.owner_hash := '';
  return r;
end $$;

create or replace function public.list_short_links(p_owner text)
returns setof public.short_links language sql security definer set search_path = public, extensions as $$
  select id, slug, destination, enabled, clicks, last_clicked_at, created_at, ''::text
  from short_links where owner_hash = public._sl_hash(p_owner) order by created_at desc limit 500
$$;

create or replace function public.set_short_link_enabled(p_id uuid, p_owner text, p_enabled boolean)
returns boolean language sql security definer set search_path = public, extensions as $$
  with u as (update short_links set enabled = p_enabled
    where id = p_id and owner_hash = public._sl_hash(p_owner) returning 1)
  select exists(select 1 from u)
$$;

create or replace function public.delete_short_link(p_id uuid, p_owner text)
returns boolean language sql security definer set search_path = public, extensions as $$
  with d as (delete from short_links
    where id = p_id and owner_hash = public._sl_hash(p_owner) returning 1)
  select exists(select 1 from d)
$$;

create or replace function public.resolve_short_link(p_slug text)
returns text language sql security definer set search_path = public as $$
  update short_links set clicks = clicks + 1, last_clicked_at = now()
  where slug = p_slug and enabled returning destination
$$;

revoke all on function public.create_short_link(text, text, text) from public;
revoke all on function public.list_short_links(text) from public;
revoke all on function public.set_short_link_enabled(uuid, text, boolean) from public;
revoke all on function public.delete_short_link(uuid, text) from public;
revoke all on function public.resolve_short_link(text) from public;
grant execute on function public.create_short_link(text, text, text) to anon, authenticated;
grant execute on function public.list_short_links(text) to anon, authenticated;
grant execute on function public.set_short_link_enabled(uuid, text, boolean) to anon, authenticated;
grant execute on function public.delete_short_link(uuid, text) to anon, authenticated;
grant execute on function public.resolve_short_link(text) to anon, authenticated;

create table public.redirect_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  start_url text not null,
  final_url text,
  final_status integer,
  total_hops integer not null default 0,
  total_redirects integer not null default 0,
  total_response_time_ms integer not null default 0,
  redirect_loop boolean not null default false,
  issue_count integer not null default 0,
  result jsonb not null
);
grant select, insert on public.redirect_analyses to anon, authenticated;
grant all on public.redirect_analyses to service_role;
alter table public.redirect_analyses enable row level security;
create policy "Anyone can save analyses" on public.redirect_analyses for insert to anon, authenticated with check (length(start_url) <= 4096);
create policy "Anyone can read shared analyses" on public.redirect_analyses for select to anon, authenticated using (true);