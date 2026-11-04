-- ============================================================================
-- 003 · Reset desde el panel de anfitriona (solo administradores)
--
-- admin_reset('trivia'): borra todos los intentos de la trivia y la reabre. Conserva cuentas
--   y respuestas de la encuesta. Para una ronda de práctica o un segundo grupo.
-- admin_reset('todo'):   borra todas las cuentas de alumnos (las no administradoras) y, en
--   cascada, sus intentos y encuestas; borra también los intentos y encuestas que pudieran
--   haber dejado las cuentas de administración; reabre la trivia. Conserva las cuentas de
--   administración y la lista de mails autorizados. Para otro colegio.
-- Se puede volver a ejecutar sin problema.
-- ============================================================================

create or replace function public.admin_reset(que text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_int int := 0; n_enc int := 0; n_usr int := 0;
begin
  if not public.es_admin() then return jsonb_build_object('ok', false, 'error', 'no_admin'); end if;
  if que = 'trivia' then
    select count(*) into n_int from public.trivia_intentos;
    delete from public.trivia_intentos;
    update public.trivia_config set abierta = true where id = 1;
  elsif que = 'todo' then
    select count(*) into n_usr from public.perfiles where not es_admin;
    select count(*) into n_int from public.trivia_intentos;
    select count(*) into n_enc from public.encuesta;
    delete from auth.users u using public.perfiles p where p.id = u.id and not p.es_admin;
    delete from public.trivia_intentos;
    delete from public.encuesta;
    update public.trivia_config set abierta = true where id = 1;
  else
    return jsonb_build_object('ok', false, 'error', 'que');
  end if;
  return jsonb_build_object('ok', true, 'que', que, 'intentos', n_int, 'encuestas', n_enc, 'cuentas', n_usr);
end $$;
revoke execute on function public.admin_reset(text) from public, anon, authenticated;
grant execute on function public.admin_reset(text) to authenticated;
comment on function public.admin_reset(text) is 'viaviva-recorrida';
