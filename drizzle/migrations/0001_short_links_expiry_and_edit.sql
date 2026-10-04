ALTER TABLE public.short_links ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.resolve_short_link(p_slug text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  update short_links set clicks = clicks + 1, last_clicked_at = now()
  where slug = p_slug and enabled
    and (expires_at is null or expires_at > now())
  returning destination
$function$;

CREATE OR REPLACE FUNCTION public.list_short_links(p_owner text)
RETURNS SETOF short_links
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  select id, slug, destination, enabled, clicks, last_clicked_at, created_at, ''::text, expires_at
  from short_links where owner_hash = public._sl_hash(p_owner) order by created_at desc limit 500
$function$;

CREATE OR REPLACE FUNCTION public.update_short_link_destination(p_id uuid, p_owner text, p_destination text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  with u as (update short_links set destination = p_destination
    where id = p_id and owner_hash = public._sl_hash(p_owner) returning 1)
  select exists(select 1 from u)
$function$;

CREATE OR REPLACE FUNCTION public.set_short_link_expiry(p_id uuid, p_owner text, p_expires_at timestamptz)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  with u as (update short_links set expires_at = p_expires_at
    where id = p_id and owner_hash = public._sl_hash(p_owner) returning 1)
  select exists(select 1 from u)
$function$;

GRANT EXECUTE ON FUNCTION public.update_short_link_destination(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_short_link_expiry(uuid, text, timestamptz) TO anon, authenticated;