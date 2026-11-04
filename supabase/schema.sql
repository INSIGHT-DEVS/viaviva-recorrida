-- ============================================================================
-- VIAVIVA · Recorrida "Vamos a VIAVIVA"
-- Base de datos para Supabase: perfiles, trivia en modo competencia y encuesta.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Se puede volver a ejecutar sin problema: no borra datos.
--
-- Seguridad:
--  · Todas las tablas tienen RLS. Nadie lee ni escribe tablas directamente desde la página:
--    todo pasa por las funciones de abajo, que validan quién llama.
--  · Las respuestas correctas viven en trivia_clave y solo las ve el servidor.
--  · El tiempo de cada participante lo mide el servidor (no el celular).
-- ============================================================================

-- ---------- Control de seguridad: no pisar nada de otro proyecto ----------
-- Si este proyecto de Supabase ya tiene tablas o funciones con estos nombres que NO son de
-- esta recorrida, el script se detiene sin cambiar nada. En ese caso, usá un proyecto nuevo.
do $guard$
declare
  t text; f text; c text;
begin
  foreach t in array array['perfiles','trivia_config','trivia_clave','trivia_intentos','encuesta','ver_ranking','ver_encuesta'] loop
    if to_regclass('public.'||t) is not null then
      select obj_description(to_regclass('public.'||t), 'pg_class') into c;
      if c is distinct from 'viaviva-recorrida' then
        raise exception 'Este proyecto ya tiene una tabla o vista "public.%" que no es de la recorrida VIAVIVA. No se cambió nada. Creá un proyecto nuevo de Supabase para la recorrida.', t;
      end if;
    end if;
  end loop;
  foreach f in array array['crear_perfil','es_admin','nombre_publico','trivia_abierta','trivia_clave_lista','trivia_resultado_de','mi_estado','trivia_empezar','trivia_enviar','trivia_ranking','encuesta_enviar','admin_panel','admin_abrir'] loop
    for c in select coalesce(obj_description(p.oid, 'pg_proc'), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = f loop
      if c <> 'viaviva-recorrida' then
        raise exception 'Este proyecto ya tiene una función "public.%" que no es de la recorrida VIAVIVA. No se cambió nada. Creá un proyecto nuevo de Supabase para la recorrida.', f;
      end if;
    end loop;
  end loop;
end $guard$;

-- ---------- Perfiles (uno por usuario de Supabase Auth) ----------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default '',
  apellido   text not null default '',
  es_admin   boolean not null default false,
  creado     timestamptz not null default now()
);

-- Al crear una cuenta, se crea su perfil con el nombre y apellido que cargó en el registro.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, apellido)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data->>'nombre', '')), 40),
    left(btrim(coalesce(new.raw_user_meta_data->>'apellido', '')), 40)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;  -- nombre propio de la recorrida
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------- Trivia ----------
create table if not exists public.trivia_config (
  id       int primary key default 1 check (id = 1),
  abierta  boolean not null default true
);
insert into public.trivia_config (id, abierta) values (1, true) on conflict (id) do nothing;

-- Respuesta correcta de cada pregunta: índice de la opción, empezando en 0, en el orden de la página.
create table if not exists public.trivia_clave (
  pregunta  int primary key check (pregunta between 1 and 50),
  correcta  int not null
);
insert into public.trivia_clave (pregunta, correcta) values
  (1,0),(2,2),(3,1),(4,0),(5,2),(6,2),(7,1),(8,1),(9,2),(10,0)
on conflict (pregunta) do update set correcta = excluded.correcta;

create table if not exists public.trivia_intentos (
  user_id     uuid primary key references public.perfiles(id) on delete cascade,
  inicio      timestamptz not null default now(),
  fin         timestamptz,
  segundos    int,
  correctas   int,
  respuestas  int[]
);

-- ---------- Encuesta ----------
create table if not exists public.encuesta (
  user_id     uuid primary key references public.perfiles(id) on delete cascade,
  creada      timestamptz not null default now(),
  respuestas  jsonb not null
);

-- ---------- RLS: nada se lee ni se escribe directo desde la página ----------
alter table public.perfiles        enable row level security;
alter table public.trivia_config   enable row level security;
alter table public.trivia_clave    enable row level security;
alter table public.trivia_intentos enable row level security;
alter table public.encuesta        enable row level security;

drop policy if exists "cada uno ve su perfil" on public.perfiles;
create policy "cada uno ve su perfil" on public.perfiles
  for select to authenticated using (id = auth.uid());

revoke all on public.perfiles, public.trivia_config, public.trivia_clave,
              public.trivia_intentos, public.encuesta from anon, authenticated;
grant select on public.perfiles to authenticated;

-- ---------- Funciones auxiliares ----------
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false)
$$;

create or replace function public.nombre_publico(n text, a text)
returns text language sql immutable as $$
  select btrim(n || ' ' || case when a <> '' then upper(left(a, 1)) || '.' else '' end)
$$;

create or replace function public.trivia_abierta()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select abierta from public.trivia_config where id = 1), true)
$$;

create or replace function public.trivia_clave_lista()
returns int[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(correcta order by pregunta), '{}') from public.trivia_clave
$$;

-- Resultado de un usuario: puntaje, tiempo, sus respuestas, la clave y su posición.
create or replace function public.trivia_resultado_de(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with fin as (
    select user_id, correctas, segundos,
           row_number() over (order by correctas desc, segundos asc, fin asc) as pos
    from public.trivia_intentos where fin is not null
  )
  select jsonb_build_object(
    'ok', true,
    'score', i.correctas,
    'seconds', i.segundos,
    'answers', to_jsonb(i.respuestas),
    'correct', to_jsonb(public.trivia_clave_lista()),
    'position', (select pos from fin where fin.user_id = uid)
  )
  from public.trivia_intentos i where i.user_id = uid and i.fin is not null
$$;

-- ---------- Funciones que usa la página ----------

-- Mi estado: perfil, si la trivia está abierta, mi intento y si ya respondí la encuesta.
create or replace function public.mi_estado()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); p record; i record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  select * into p from public.perfiles where id = uid;
  select * into i from public.trivia_intentos where user_id = uid;
  return jsonb_build_object(
    'ok', true,
    'nombre', coalesce(p.nombre, ''), 'apellido', coalesce(p.apellido, ''),
    'es_admin', coalesce(p.es_admin, false),
    'abierta', public.trivia_abierta(),
    'intento', case
      when i.user_id is null then null
      when i.fin is null then jsonb_build_object('estado', 'jugando', 'transcurrido', extract(epoch from now() - i.inicio)::int)
      else public.trivia_resultado_de(uid) || jsonb_build_object('estado', 'terminado')
    end,
    'encuesta_respondida', exists (select 1 from public.encuesta where user_id = uid)
  );
end $$;

create or replace function public.trivia_empezar()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); i record; p record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  select * into p from public.perfiles where id = uid;
  if p.id is null or p.nombre = '' or p.apellido = '' then
    return jsonb_build_object('ok', false, 'error', 'sin_nombre');
  end if;
  select * into i from public.trivia_intentos where user_id = uid;
  if i.user_id is not null and i.fin is not null then
    return jsonb_build_object('ok', false, 'error', 'ya_participo');
  end if;
  if not public.trivia_abierta() then
    return jsonb_build_object('ok', false, 'error', 'cerrada');
  end if;
  if i.user_id is null then
    insert into public.trivia_intentos (user_id) values (uid);
    return jsonb_build_object('ok', true, 'transcurrido', 0);
  end if;
  -- Ya había empezado y no terminó: sigue con su tiempo original.
  return jsonb_build_object('ok', true, 'transcurrido', extract(epoch from now() - i.inicio)::int);
end $$;

create or replace function public.trivia_enviar(respuestas int[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); i record; n int; puntos int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  select * into i from public.trivia_intentos where user_id = uid for update;
  if i.user_id is null then return jsonb_build_object('ok', false, 'error', 'sin_intento'); end if;
  if i.fin is not null then return public.trivia_resultado_de(uid); end if; -- ya envió: devuelve lo guardado
  if not public.trivia_abierta() then return jsonb_build_object('ok', false, 'error', 'cerrada'); end if;
  select count(*) into n from public.trivia_clave;
  if respuestas is null or coalesce(array_length(respuestas, 1), 0) <> n then
    return jsonb_build_object('ok', false, 'error', 'respuestas');
  end if;
  select count(*) into puntos from public.trivia_clave k where respuestas[k.pregunta] = k.correcta;
  update public.trivia_intentos
     set fin = now(),
         segundos = greatest(0, extract(epoch from now() - inicio)::int),
         correctas = puntos,
         respuestas = trivia_enviar.respuestas
   where user_id = uid;
  return public.trivia_resultado_de(uid);
end $$;

-- Ranking público: nombre + inicial del apellido. Lo puede ver cualquiera, con o sin cuenta.
create or replace function public.trivia_ranking()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true,
    'open', public.trivia_abierta(),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', nombre, 'score', correctas, 'seconds', segundos) order by correctas desc, segundos asc, fin asc)
      from (
        select public.nombre_publico(p.nombre, p.apellido) as nombre, i.correctas, i.segundos, i.fin
        from public.trivia_intentos i join public.perfiles p on p.id = i.user_id
        where i.fin is not null
        order by i.correctas desc, i.segundos asc, i.fin asc
        limit 100
      ) t
    ), '[]'::jsonb)
  )
$$;

create or replace function public.encuesta_enviar(respuestas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'no_auth'); end if;
  if respuestas is null or jsonb_typeof(respuestas) <> 'object' or length(respuestas::text) > 8000 then
    return jsonb_build_object('ok', false, 'error', 'formato');
  end if;
  insert into public.encuesta (user_id, respuestas) values (uid, respuestas)
  on conflict (user_id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Panel de anfitriona (solo cuentas con es_admin = true) ----------
create or replace function public.admin_panel()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then return jsonb_build_object('ok', false, 'error', 'no_admin'); end if;
  return jsonb_build_object(
    'ok', true,
    'open', public.trivia_abierta(),
    'registrados', (select count(*) from public.perfiles),
    'started', (select count(*) from public.trivia_intentos),
    'finished', (select count(*) from public.trivia_intentos where fin is not null),
    'encuestas', (select count(*) from public.encuesta),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', btrim(p.nombre || ' ' || p.apellido), 'score', i.correctas, 'seconds', i.segundos)
                       order by i.correctas desc, i.segundos asc, i.fin asc)
      from public.trivia_intentos i join public.perfiles p on p.id = i.user_id
      where i.fin is not null
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.admin_abrir(abrir boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then return jsonb_build_object('ok', false, 'error', 'no_admin'); end if;
  update public.trivia_config set abierta = abrir where id = 1;
  return public.admin_panel();
end $$;

-- ---------- Permisos de ejecución ----------
-- Solo se tocan los permisos de las funciones de la recorrida (no las de otros proyectos).
revoke execute on function public.crear_perfil(), public.es_admin(), public.nombre_publico(text, text),
  public.trivia_abierta(), public.trivia_clave_lista(), public.trivia_resultado_de(uuid),
  public.mi_estado(), public.trivia_empezar(), public.trivia_enviar(int[]), public.trivia_ranking(),
  public.encuesta_enviar(jsonb), public.admin_panel(), public.admin_abrir(boolean)
  from public, anon, authenticated;
grant execute on function public.trivia_ranking()               to anon, authenticated;
grant execute on function public.mi_estado()                    to authenticated;
grant execute on function public.trivia_empezar()               to authenticated;
grant execute on function public.trivia_enviar(int[])           to authenticated;
grant execute on function public.encuesta_enviar(jsonb)         to authenticated;
grant execute on function public.admin_panel()                  to authenticated;
grant execute on function public.admin_abrir(boolean)           to authenticated;

-- ---------- Vistas para exportar desde el panel de Supabase (Table Editor / SQL) ----------
create or replace view public.ver_ranking with (security_invoker = true) as
  select row_number() over (order by i.correctas desc, i.segundos asc, i.fin asc) as puesto,
         p.nombre, p.apellido, u.email, i.correctas, i.segundos, i.inicio, i.fin, i.respuestas
  from public.trivia_intentos i join public.perfiles p on p.id = i.user_id join auth.users u on u.id = p.id
  where i.fin is not null;

create or replace view public.ver_encuesta with (security_invoker = true) as
  select e.creada,
         e.respuestas->>'conocias'   as conocias,
         e.respuestas->>'tramo'      as tramo,
         e.respuestas->>'conquien'   as con_quien,
         e.respuestas->>'plan'       as plan,
         e.respuestas->>'plan_otro'  as plan_otro,
         e.respuestas->>'cuando'     as cuando,
         e.respuestas->>'donde'      as donde,
         e.respuestas->>'donde_otro' as donde_otro,
         e.respuestas->>'sigue'      as sigue,
         e.respuestas->>'gusto'      as gusto,
         e.respuestas->>'falta'      as falta,
         e.respuestas->>'edad'       as edad
  from public.encuesta e;
revoke all on public.ver_ranking, public.ver_encuesta from anon, authenticated;

-- ---------- Marca: identifica estos objetos como de la recorrida (lo usa el control de arriba) ----------
comment on table public.perfiles        is 'viaviva-recorrida';
comment on table public.trivia_config   is 'viaviva-recorrida';
comment on table public.trivia_clave    is 'viaviva-recorrida';
comment on table public.trivia_intentos is 'viaviva-recorrida';
comment on table public.encuesta        is 'viaviva-recorrida';
comment on view  public.ver_ranking     is 'viaviva-recorrida';
comment on view  public.ver_encuesta    is 'viaviva-recorrida';
comment on function public.crear_perfil() is 'viaviva-recorrida';
comment on function public.es_admin() is 'viaviva-recorrida';
comment on function public.nombre_publico(text, text) is 'viaviva-recorrida';
comment on function public.trivia_abierta() is 'viaviva-recorrida';
comment on function public.trivia_clave_lista() is 'viaviva-recorrida';
comment on function public.trivia_resultado_de(uuid) is 'viaviva-recorrida';
comment on function public.mi_estado() is 'viaviva-recorrida';
comment on function public.trivia_empezar() is 'viaviva-recorrida';
comment on function public.trivia_enviar(int[]) is 'viaviva-recorrida';
comment on function public.trivia_ranking() is 'viaviva-recorrida';
comment on function public.encuesta_enviar(jsonb) is 'viaviva-recorrida';
comment on function public.admin_panel() is 'viaviva-recorrida';
comment on function public.admin_abrir(boolean) is 'viaviva-recorrida';

-- ============================================================================
-- DESPUÉS DE CREAR TU CUENTA en la página, convertila en administradora
-- (cambiá el mail y ejecutá solo esta línea):
--
--   update public.perfiles set es_admin = true
--   where id = (select id from auth.users where email = 'carlafascetti@viaviva.com.ar');
-- ============================================================================
