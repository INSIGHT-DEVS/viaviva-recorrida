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
    await page.evaluate(() => { me.session = null; drawAll(); });
    check('al cerrar sesión, vuelve el ingreso', await gate.isVisible());
    await page.goto(base + '/#anfitrion', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const gh = await page.locator('#gate').innerText();
    check('en #anfitrion el ingreso arranca en "Ingresar"', gh.includes('administradora') && (await page.locator('#gate [role=tab][aria-selected="true"]').innerText()) === 'Ingresar', gh.slice(0, 80));
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
