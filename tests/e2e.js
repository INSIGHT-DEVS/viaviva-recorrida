// Prueba de humo: sirve la carpeta del repo y recorre la página con Chromium (Playwright), en dos modos:
//   · "en vivo": config.js del repo → aparece el ingreso general (no crea cuentas ni toca la base)
//   · "práctica": config.js vacío → sin ingreso, trivia y encuesta en modo práctica
// Uso: npm test   (antes, una vez: npm install && npx playwright install chromium)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const CONFIG_VACIO = 'window.VIAVIVA_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };\n';

function serve(modo) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p === '/') p = '/index.html';
      if (p === '/config.js' && modo === 'practica') { res.writeHead(200, { 'Content-Type': MIME['.js'] }); return res.end(CONFIG_VACIO); }
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const checks = [];
function check(name, ok, detail) { checks.push({ name, ok }); console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  → ' + detail)); }

async function correr(browser, modo) {
  console.log(`\nModo ${modo}`);
  const srv = await serve(modo);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|ERR_TUNNEL|ERR_INTERNET/.test(m.text())) errors.push(m.text()); });

  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const live = await page.evaluate(() => typeof LIVE !== 'undefined' && LIVE);
  check(`la app arranca en modo ${modo}`, live === (modo === 'vivo'));
  check('10 secciones renderizadas', (await page.locator('section.sec').count()) === 10);
  check('fuentes cargadas', await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check("16px 'Google Sans Flex'") && document.fonts.check("16px 'Roboto Mono'"); }));

  if (live) {
    check('librería de Supabase cargada desde el repo', await page.evaluate(() => typeof window.supabase === 'object' && !!window.supabase.createClient));
    const gate = page.locator('#gate');
    check('ingreso general visible antes de entrar', await gate.isVisible() && await page.evaluate(() => document.body.classList.contains('gated')));
    const gtxt = await gate.innerText();
    check('ingreso ofrece crear cuenta e ingresar', gtxt.includes('Crear cuenta') && gtxt.includes('Ingresar'), gtxt.slice(0, 100));
    check('ingreso pide nombre, apellido, mail y contraseña', (await gate.locator('input[type=text]').count()) === 2 && (await gate.locator('input[type=email]').count()) === 1 && (await gate.locator('input[type=password]').count()) === 1);
    check('la recorrida queda tapada (sin scroll de fondo)', await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'));
    // Simula sesión iniciada (sin red): el ingreso desaparece y la página queda visible.
    await page.evaluate(() => { me.session = { user: { id: '00000000-0000-4000-8000-000000000000' } }; me.loading = false; drawAll(); });
    check('con sesión, el ingreso desaparece', !(await gate.isVisible()) && await page.evaluate(() => !document.body.classList.contains('gated')));
    // Barra del participante (arriba de todo): nombre y puntaje.
    await page.evaluate(() => { me.estado = { ok: true, nombre: 'Ana', apellido: 'Pérez', es_admin: false, abierta: true, intento: null, encuesta_respondida: false }; drawAll(); });
    let mb = await page.locator('#mebar').innerText();
    check('barra del participante: nombre y "Trivia pendiente" antes de jugar', await page.locator('#mebar').isVisible() && mb.includes('Ana Pérez') && /trivia pendiente/i.test(mb), mb);
    await page.evaluate(() => { me.estado.intento = { estado: 'terminado', score: 7, seconds: 130, position: 3, answers: [], correct: [] }; drawAll(); });
    mb = await page.locator('#mebar').innerText();
    check('barra del participante: puntaje y puesto al terminar', /trivia 7\/10 · 3°/i.test(mb), mb);
    check('barra del participante: queda fija arriba', await page.evaluate(() => getComputedStyle(document.querySelector('#mebar')).position === 'sticky'));
    await page.evaluate(() => { me.estado.es_admin = true; drawAll(); });
    mb = await page.locator('#mebar').innerText();
    check('barra del participante: para admins lleva al panel', /panel de anfitriona/i.test(mb) && (await page.locator('#mebar a').getAttribute('href')) === '#anfitrion', mb);
    await page.evaluate(() => { me.estado = null; me.session = null; drawAll(); });
    check('al cerrar sesión, vuelve el ingreso', await gate.isVisible() && !(await page.locator('#mebar').isVisible()));
    await page.goto(base + '/#anfitrion', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const gh = await page.locator('#gate').innerText();
    check('en #anfitrion el ingreso arranca en "Ingresar"', gh.includes('administradora') && (await page.locator('#gate [role=tab][aria-selected="true"]').innerText()) === 'Ingresar', gh.slice(0, 80));
    // Panel de resultados con datos simulados (sin red ni cuentas reales): premios, tabla, encuesta y CSV.
    await page.evaluate(() => {
      me.session = { user: { id: '00000000-0000-4000-8000-000000000000', email: 'admin@example.com' } }; me.loading = false;
      host.data = { ok: true, open: false, registrados: 4, started: 4, finished: 3, encuestas: 2, rows: [
        { nombre: 'Ana Pérez', score: 10, seconds: 95 }, { nombre: 'Bruno Gómez', score: 10, seconds: 120 }, { nombre: 'Caro Díaz', score: 6, seconds: 80 } ] };
      host.res = { ok: true, open: false, total_preguntas: 10,
        ranking: [
          { puesto: 1, nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', correctas: 10, segundos: 95, inicio: 'i', fin: 'f', respuestas: [0,2,1,0,2,2,1,1,2,0] },
          { puesto: 2, nombre: 'Bruno', apellido: 'Gómez', email: 'bruno@example.com', correctas: 10, segundos: 120, inicio: 'i', fin: 'f', respuestas: [0,2,1,0,2,2,1,1,2,0] },
          { puesto: 3, nombre: 'Caro', apellido: 'Díaz', email: 'caro@example.com', correctas: 6, segundos: 80, inicio: 'i', fin: 'f', respuestas: [0,2,1,0,2,2,0,0,0,1] } ],
        sin_terminar: [{ nombre: 'Dani', apellido: 'López', email: 'dani@example.com', estado: 'jugando' }],
        encuestas: [
          { creada: '2026-11-06T13:00:00Z', respuestas: { conocias: 'Es la primera vez', plan: ['Comer algo rico', 'Festivales y eventos'], edad: '15 o 16', gusto: 'El mapa' } },
          { creada: '2026-11-06T13:05:00Z', respuestas: { conocias: 'Vine alguna vez', plan: ['Comer algo rico'], edad: '15 o 16' } } ] };
      drawAll();
    });
    const res = page.locator('#host-res');
    const rtxt = await res.innerText();
    check('panel de resultados: 3 premios con nombre completo y mail', (await res.locator('.premio').count()) === 3 && /1er premio/i.test(rtxt) && rtxt.includes('Ana Pérez') && rtxt.includes('ana@example.com'));
    check('panel de resultados: título "Ganadores" con la trivia cerrada', rtxt.includes('Ganadores'));
    check('panel de resultados: tabla completa con 3 filas', (await res.locator('table tbody tr').count()) === 3);
    check('panel de resultados: lista quiénes no terminaron', rtxt.includes('Sin terminar (1): Dani López (jugando)'));
    check('panel de resultados: resumen de la encuesta cuenta opciones', rtxt.includes('Encuesta · 2 respuestas') && rtxt.includes('Comer algo rico') && rtxt.includes('El mapa'));
    const csv = await page.evaluate(() => ({ r: csvRanking(host.res.ranking, 10), e: csvEncuesta(host.res.encuestas) }));
    check('CSV del ranking: cabecera + 3 filas, respuestas en texto', csv.r.split('\r\n').length === 4 && csv.r.includes('"Ana";"Pérez"') && csv.r.includes('"4,5 km"'));
    check('CSV de la encuesta: cabecera + 2 filas con opciones múltiples unidas', csv.e.split('\r\n').length === 3 && csv.e.includes('Comer algo rico | Festivales y eventos'));
    check('botones de descarga habilitados', !(await page.locator('#host-csv-ranking').isDisabled()) && !(await page.locator('#host-csv-encuesta').isDisabled()));
    // Zona de reinicio: dos botones con confirmación en dos toques; sin red, el segundo toque avisa.
    check('zona de reinicio con sus dos opciones', (await page.locator('#host-reset-trivia').count()) === 1 && (await page.locator('#host-reset-todo').count()) === 1);
    await page.click('#host-reset-todo');
    await page.waitForTimeout(200);
    check('primer toque solo arma la confirmación', (await page.locator('#host-reset-todo').innerText()).includes('Tocá de nuevo para confirmar') && (await page.locator('#host-reset-trivia').innerText()) === 'Reiniciar la trivia');
    await page.evaluate(() => { refreshMe = async () => {}; loadRank = async () => {}; }); // sin red: no pisar la sesión simulada
    await page.click('#host-reset-todo');
    await page.waitForTimeout(1500);
    const rmsg = await page.locator('#host-reset-msg').innerText().catch(() => '');
    check('segundo toque llama al servidor (sin red avisa y no rompe)', /sin conexión|no se pudo/i.test(rmsg), rmsg);
  } else {
    check('sin Supabase no hay ingreso general', !(await page.locator('#gate').isVisible()));
    check('mapa SVG con 6 puntos', (await page.locator('#map g.pin').count()) === 6);
    await page.click('g.pin[data-id="pampa"]');
    await page.waitForTimeout(200);
    check('tocar un punto del mapa abre su panel', (await page.locator('#panel').innerText()).includes('La barrera más famosa'));
    check('antes/después con control deslizable', (await page.locator('#ba input[type=range]').count()) === 1);
    check('5 pasos de obra', (await page.locator('#steps article.step').count()) === 5);
    await page.click('#int-disenar');
    await page.waitForTimeout(200);
    check('elegir un interés marca oficios "Para vos"', (await page.locator('#groups .of.hit').count()) >= 1);
    check('trivia en modo práctica avisa que falta Supabase', (await page.locator('#tv').innerText()).includes('no está conectada'));
    check('encuesta en modo práctica abre el Google Form', (await page.locator('#survey').innerHTML()).includes('forms.gle'));
    await page.goto(base + '/#anfitrion', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    check('panel #anfitrion visible', await page.locator('#host').isVisible() && (await page.locator('#host').innerText()).length > 20);
  }

  check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));
  await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, `ultima-corrida-${modo}.png`), fullPage: false });
  await ctx.close();
  srv.close();
}

(async () => {
  const browser = await chromium.launch();
  await correr(browser, 'vivo');
  await correr(browser, 'practica');
  await browser.close();
  const failed = checks.filter(c => !c.ok).length;
  console.log(failed ? `\n${failed} chequeo(s) fallaron` : '\nTodo ok');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
