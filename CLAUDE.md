# Vamos a VIAVIVA · recorrida con colegios

Web app mobile-first que los alumnos abren desde un link durante la recorrida por VIAVIVA:
historia y mapa del paseo, trivia con ranking en vivo, encuesta, y un panel de anfitriona
(`#anfitrion`) para quien guía la visita. Idioma: español rioplatense (vos).

## Stack (sin build)

- **Frontend**: HTML + CSS + JS vanilla. No hay bundler ni `npm install` en producción:
  Vercel sirve los archivos tal cual están en el repo.
- **Backend**: Supabase, proyecto `viaviva-recorrida` (propio de esta app, no compartido).
  Auth con mail y contraseña, tablas con RLS y toda la lógica en funciones SQL
  (`supabase/schema.sql`). La página nunca lee ni escribe tablas directamente: solo llama
  RPCs (`mi_estado`, `trivia_empezar`, `trivia_enviar`, `trivia_ranking`, `encuesta_enviar`,
  `admin_panel`, `admin_abrir`). La corrección de la trivia y el tiempo los calcula el servidor.
- **Hosting**: Vercel conectado a este repo. `main` = producción. Cada rama o PR = URL de preview.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura y textos fijos de las 10 secciones. La barra superior tiene el colegio y la fecha de la visita. |
| `styles.css` | Estilos. Variables de marca en `:root`. Las fuentes se cargan desde `assets/fonts/`. |
| `contenido.js` | **Todo el contenido editable**: tramos, puntos del mapa, pasos de obra, oficios, preguntas de la trivia, encuesta. Para cambiar contenido se edita acá, sin tocar lógica. |
| `app.js` | Lógica: mapa SVG, antes/después, cuentas, trivia, ranking, panel de anfitriona, encuesta. |
| `config.js` | URL y anon key del proyecto de Supabase (públicas por diseño). Si están vacías la app corre en modo práctica, sin cuentas ni ranking. |
| `supabase/schema.sql` | Base completa e idempotente (se puede volver a ejecutar sin borrar datos). |
| `supabase/migrations/` | Cambios posteriores a la base, un archivo por cambio, numerados (`002_*.sql`, `003_*.sql`…). |
| `assets/` | Imágenes, íconos PWA, logos y fuentes woff2. |
| `tests/e2e.js` | Prueba de humo con Playwright (modo práctica). Se corre con `npm test`. |
| `vercel.json` | Headers: `noindex` (la página no aparece en Google) y `no-cache` para html, js y css. |
| `README.md` | Puesta en marcha, operación el día de la visita, exportar resultados, reinicio para otro colegio. |

## Reglas

1. **Siempre en una rama y con PR.** Nunca pushear a `main` directo. El PR tiene su URL de
   preview de Vercel: probar ahí, en un celular, antes de mergear.
2. **Trivia**: las 10 preguntas viven en `contenido.js`; la clave (índice de la opción correcta,
   empezando en 0) vive en Supabase, tabla `trivia_clave`. Si se cambia, agrega o reordena una
   pregunta u opción hay que actualizar la clave con una migración; si no, el servidor corrige mal.
3. **Base de datos**: no editar `schema.sql` para cambiar algo ya aplicado en producción. Crear
   `supabase/migrations/NNN_descripcion.sql` y aplicarlo (conector MCP de Supabase o SQL Editor).
   Mantener el patrón de las funciones: `security definer`, `set search_path = public`,
   `revoke execute ... from public, anon, authenticated` y `grant execute` explícito.
4. **Secretos**: nunca commitear la `service_role` key, contraseñas ni mails de alumnos.
   La anon key sí va en `config.js` (es pública y la base se protege con RLS).
5. **Antes de pushear**: `npm test` y mirar la página servida localmente en viewport móvil (390 px).
   No hay build que falle: los errores solo se ven en el navegador y en la consola.
6. **Dependencias**: supabase-js se carga desde CDN con versión fija (`2.45.4`). No subir de versión
   sin volver a probar crear cuenta, ingresar, trivia completa y panel.
7. **Datos de menores**: se guardan solo nombre, apellido y mail. No agregar campos personales.
   Después de cada visita se borran las cuentas de los alumnos (ver README).
8. **Contenido fijo por visita**: colegio y fecha en `index.html` (barra superior y hero). Al
   preparar otra visita, cambiar eso y el sufijo de las claves de `localStorage` en `app.js`
   (`KEY`, `TV_KEY`, `SV_KEY`) para que no quede estado de la visita anterior en los celulares.

## Correr localmente

```
npx serve -l 8080 .        # o: python3 -m http.server 8080
npm test                   # Playwright en modo práctica (necesita: npm install && npx playwright install chromium)
```

Con `config.js` completo, la app local usa **la misma base que producción**: cualquier cuenta
creada al probar hay que borrarla después (Supabase → Authentication → Users). Para probar sin
tocar la base, vaciar los dos valores de `config.js` localmente, sin commitear ese cambio.

Para el panel de anfitriona: abrir `/#anfitrion` con una cuenta marcada `es_admin = true`.

## Flujo de un cambio

```
git checkout -b nombre-del-cambio
# editar → npm test → probar en el navegador
git commit -am "qué cambió y por qué"
git push -u origin nombre-del-cambio
# abrir PR → Vercel comenta la URL de preview → probar en el celular → merge → producción en ~1 min
```
