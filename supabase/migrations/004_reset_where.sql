-- ============================================================================
-- 004 · Arreglo de admin_reset(): DELETE con WHERE
--
-- Supabase tiene activo pg_safeupdate en las llamadas que llegan por la API (PostgREST),
-- y eso incluye las RPC. Rechaza cualquier DELETE o UPDATE sin WHERE con el error
-- "DELETE requires a WHERE clause". En 003, admin_reset() borraba trivia_intentos y
-- encuesta sin WHERE, así que los botones de borrar del panel fallaban.
-- Esta migración recrea la función igual que en 003, con "where true" en esos DELETE.
-- Se puede volver a ejecutar sin problema.
-- ============================================================================

create or replace function public.admin_reset(que text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_int int := 0; n_enc int := 0; n_usr int := 0;
begin
  if not public.es_admin() then return jsonb_build_object('ok', false, 'error', 'no_admin'); end if;
  if que = 'trivia' then
    select count(*) into n_int from public.trivia_intentos;
    delete from public.trivia_intentos where true;
    update public.trivia_config set abierta = true where id = 1;
  elsif que = 'todo' then
    select count(*) into n_usr from public.perfiles where not es_admin;
    select count(*) into n_int from public.trivia_intentos;
    select count(*) into n_enc from public.encuesta;
    delete from auth.users u using public.perfiles p where p.id = u.id and not p.es_admin;
    delete from public.trivia_intentos where true;
    delete from public.encuesta where true;
    update public.trivia_config set abierta = true where id = 1;
  else
    return jsonb_build_object('ok', false, 'error', 'que');
  end if;
  return jsonb_build_object('ok', true, 'que', que, 'intentos', n_int, 'encuestas', n_enc, 'cuentas', n_usr);
end $$;
revoke execute on function public.admin_reset(text) from public, anon, authenticated;
grant execute on function public.admin_reset(text) to authenticated;
comment on function public.admin_reset(text) is 'viaviva-recorrida';
