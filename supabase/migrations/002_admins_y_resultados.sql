-- ============================================================================
-- 002 · Administradores por mail + resultados completos para el panel
--
-- 1. admins_autorizados: lista de mails que quedan como administradores en cuanto crean su
--    cuenta (el trigger crear_perfil lo resuelve solo). Los mails NO van en este archivo:
--    se cargan con un insert aparte (ver README, "Administradores").
-- 2. admin_resultados(): todo lo que necesita quien da los premios, desde la página y sin
--    entrar a Supabase: ranking completo con nombre, apellido y mail, quiénes no terminaron,
--    y las respuestas de la encuesta (sin identidad: la encuesta es anónima).
-- Se puede volver a ejecutar sin problema.
-- ============================================================================

create table if not exists public.admins_autorizados (
  email   text primary key,
  nota    text,
  creado  timestamptz not null default now()
);
alter table public.admins_autorizados enable row level security;
revoke all on public.admins_autorizados from anon, authenticated;
comment on table public.admins_autorizados is 'viaviva-recorrida';

-- El perfil nace como administrador si el mail está autorizado.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, apellido, es_admin)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data->>'nombre', '')), 40),
    left(btrim(coalesce(new.raw_user_meta_data->>'apellido', '')), 40),
    exists (select 1 from public.admins_autorizados a where lower(a.email) = lower(coalesce(new.email, '')))
  )
  on conflict (id) do nothing;
  return new;
end $$;
comment on function public.crear_perfil() is 'viaviva-recorrida';

-- Aplica la lista a cuentas que ya existían al cargarla.
create or replace function public.admins_aplicar()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.perfiles p set es_admin = true
    from auth.users u
   where u.id = p.id and not p.es_admin
     and lower(u.email) in (select lower(email) from public.admins_autorizados);
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.admins_aplicar() from public, anon, authenticated;
comment on function public.admins_aplicar() is 'viaviva-recorrida';

-- Resultados completos (solo administradores).
create or replace function public.admin_resultados()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then return jsonb_build_object('ok', false, 'error', 'no_admin'); end if;
  return jsonb_build_object(
    'ok', true,
    'open', public.trivia_abierta(),
    'total_preguntas', (select count(*) from public.trivia_clave),
    'ranking', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.puesto) from (
        select row_number() over (order by i.correctas desc, i.segundos asc, i.fin asc) as puesto,
               p.nombre, p.apellido, u.email, i.correctas, i.segundos, i.inicio, i.fin, i.respuestas
          from public.trivia_intentos i
          join public.perfiles p on p.id = i.user_id
          join auth.users u on u.id = p.id
         where i.fin is not null
      ) r
    ), '[]'::jsonb),
    'sin_terminar', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nombre', p.nombre, 'apellido', p.apellido, 'email', u.email,
               'estado', case when i.user_id is null then 'no empezó' else 'jugando' end)
             order by p.apellido, p.nombre)
        from public.perfiles p
        join auth.users u on u.id = p.id
        left join public.trivia_intentos i on i.user_id = p.id
       where (i.user_id is null or i.fin is null) and not p.es_admin
    ), '[]'::jsonb),
    'encuestas', coalesce((
      select jsonb_agg(jsonb_build_object('creada', e.creada, 'respuestas', e.respuestas) order by e.creada)
        from public.encuesta e
    ), '[]'::jsonb)
  );
end $$;
revoke execute on function public.admin_resultados() from public, anon, authenticated;
grant execute on function public.admin_resultados() to authenticated;
comment on function public.admin_resultados() is 'viaviva-recorrida';
