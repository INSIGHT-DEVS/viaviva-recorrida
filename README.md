# Vamos a VIAVIVA · recorrida con colegios

Página que los alumnos abren desde el celular durante la recorrida por VIAVIVA. Funciona así:

- Al abrir el link aparece el **ingreso**: cada alumno **crea su cuenta** con nombre, apellido, mail y contraseña (o ingresa si ya la tiene). Recién después ve la recorrida (historia, mapa y tramos).
- Con esa misma cuenta **juega la trivia** y **responde la encuesta**.
- El ranking se actualiza en vivo. Quien guía la visita maneja el **panel de anfitriona** desde el celular (`/#anfitrion`), con una cuenta de administradora.
- La página no aparece en Google.

Producción: `https://viaviva-recorrida.vercel.app`. Cómo está armado el código y cómo se modifica: ver `CLAUDE.md`.

---

## Puesta en marcha (una sola vez)

### 1. Supabase: la base de datos

Se usa un proyecto de Supabase **propio de esta app** (`viaviva-recorrida`). No se comparte con otra app porque los ajustes de login (confirmación de mail, Site URL, rate limits) son de todo el proyecto y porque las cuentas de los chicos (menores) no deben mezclarse con otros usuarios.

1. **Cargar la base**: SQL Editor → New query → pegar **todo** `supabase/schema.sql` → Run. Tiene que decir *"Success. No rows returned"*. (También se puede aplicar con el conector MCP de Supabase desde Claude.)
2. **Cuentas activas al instante, sin confirmar el mail**: Authentication → Sign In / Providers → Email: dejar habilitado y **desactivar "Confirm email"**. Si queda activado, cada chico tiene que abrir su mail para confirmar antes de jugar, y en la calle eso falla seguido.
3. **Dirección de la página**: Authentication → URL Configuration → Site URL `https://viaviva-recorrida.vercel.app` y en Redirect URLs agregar `https://viaviva-recorrida.vercel.app/**`.
4. **Muchos chicos a la vez**: Authentication → Rate Limits → subir *"Rate limit for sign-ups and sign-ins"* a **150** cada 5 minutos. Si comparten wifi o red, Supabase los ve como una sola persona y bloquea registros.
5. **Datos de conexión**: Project Settings → API (o Data API): copiar la **Project URL** y la clave **anon public** (empieza con `eyJ`; si solo aparece *Publishable key*, buscar la pestaña *Legacy API keys*). Van en `config.js`. **Nunca** la `service_role`.

### 2. Vercel: publicar desde el repo

1. En Vercel → Add New → Project → Import Git Repository → elegir este repo (si no aparece, "Adjust GitHub App Permissions" para darle acceso a la organización).
2. Framework Preset: **Other**. Sin más cambios → Deploy.
3. Si la URL que da Vercel no es `https://viaviva-recorrida.vercel.app`, cambiarla en el paso 1.3 de Supabase y en las etiquetas `og:url` / `og:image` de `index.html`.

Desde ese momento, cada push a `main` publica solo; cada rama o PR tiene su URL de preview.

### 3. Cuentas de administración

Los mails autorizados viven en la tabla `admins_autorizados` de Supabase: cualquier cuenta creada con uno de esos mails nace como administradora, sin ningún paso extra. Para autorizar a alguien más, en Supabase → SQL Editor (o pidiéndoselo a Claude con el conector):

```sql
insert into public.admins_autorizados (email, nota) values ('mail@ejemplo.com', 'Quién es') on conflict do nothing;
select public.admins_aplicar();  -- marca también las cuentas que ya existían con ese mail
```

Después, cada administrador:

1. Abre la página y, en el ingreso, toca **Crear cuenta** con su mail autorizado. **No juega la trivia con esa cuenta**, porque aparecería en el ranking.
2. En el celular, abre `https://viaviva-recorrida.vercel.app/#anfitrion`. Tiene que aparecer el panel. Guardarlo en favoritos.

### 4. Probar

Desde **otro** celular o en una ventana de incógnito:

1. Crear una cuenta de prueba y jugar la trivia: tiene que aparecer en el ranking.
2. Responder la encuesta: tiene que aparecer "¡Gracias por responder!".
3. En el panel tienen que figurar 1 cuenta que terminó y 1 encuesta.
4. Compartir el link por WhatsApp: tiene que aparecer la imagen de VIAVIVA con "Vamos a VIAVIVA".
5. **Borrar la cuenta de prueba**: Supabase → Authentication → Users → seleccionarla → Delete user. Se borran también su intento y su encuesta.

Opcional: si querés que el link diga `viaviva.com.ar/recorrida`, en Wix → SEO → Administrador de redirecciones de URL → nueva redirección de `/recorrida` a `https://viaviva-recorrida.vercel.app`.

---

## El día de la visita

**Para los chicos:** compartí el link. Al abrirlo, cada uno crea su cuenta en la pantalla de ingreso (si ya la creó, toca **Ingresar**) y entra a la recorrida. Con la misma cuenta juega la trivia y responde la encuesta. La sesión queda guardada en el celular: si cierra y vuelve a abrir el link, entra directo.

**Para quien guía, desde el celular:** abrí el favorito `…vercel.app/#anfitrion`.

- Ves cuántos empezaron, cuántos están jugando y cuántos terminaron, las cuentas creadas, las encuestas respondidas, quién va ganando (nombre completo, puntaje y tiempo) y, más abajo, los resultados completos con los tres premios.
- Cuando "jugando ahora" llegue a 0, tocá **Cerrar trivia y anunciar ganador** y confirmá. En tu pantalla y en la de todos aparece **"Ganó …"**.
- Si cerraste sin querer, tocá **Reabrir trivia**.

**Reglas que aplica el sistema:**

- Una participación por cuenta.
- Las respuestas no se pueden cambiar.
- La corrección y el tiempo los hace el servidor.
- Gana quien tenga más correctas. Si hay empate, gana quien tardó menos.

## Resultados, premios y encuesta

Todo está en el panel `/#anfitrion`, sección **Resultados y premios**, sin entrar a Supabase:

- **Ganadores**: los tres primeros puestos con nombre completo, mail, correctas y tiempo (más correctas gana; a igual puntaje, menos tiempo). Mientras la trivia está abierta dice "Van ganando"; al cerrarla, "Ganadores".
- **Tabla completa** de todos los que terminaron, y la lista de quiénes crearon cuenta pero no terminaron.
- **Encuesta**: cantidad de respuestas y, por pregunta, cuántos eligieron cada opción; las respuestas abiertas se listan completas. La encuesta es anónima: no se muestra quién respondió qué.
- **Descargar ranking (CSV)** y **Descargar encuesta (CSV)**: se abren en Excel o Google Sheets (separados por punto y coma). El CSV del ranking incluye la respuesta que dio cada uno a cada pregunta.

Las mismas vistas existen en Supabase (Table Editor → `ver_ranking` y `ver_encuesta`) para quien tenga acceso al proyecto.

## Cosas a tener en cuenta

- **Si el proyecto de Supabase está en plan gratuito**, se pausa tras 7 días sin uso. Antes de cada visita, entrar al panel de Supabase; si dice *Paused*, tocar **Restore** y esperar unos minutos.
- **Datos de menores:** se guardan el nombre, el apellido y el mail. Avisar al colegio. Después de la actividad, borrar las cuentas de los chicos: Authentication → Users → seleccionar todas menos la de administración → Delete. Si se quiere conservar la encuesta, exportar antes `ver_encuesta`.
- **Olvido de contraseña:** en "Ingresar" está "Me olvidé la contraseña", que manda un mail. El envío de mails gratuito de Supabase es limitado (pocos por hora). Si a un chico le pasa en la calle, lo más rápido es que cree una cuenta nueva con otro mail, siempre que no haya jugado todavía.
- **Para la próxima visita (otro colegio):** en SQL Editor ejecutar `delete from public.trivia_intentos; update public.trivia_config set abierta = true;` para empezar un ranking nuevo, y cambiar colegio y fecha en `index.html` (ver `CLAUDE.md`, regla 8).
