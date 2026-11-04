// Prueba de humo: sirve la carpeta del repo y recorre la página con Chromium (Playwright).
// Uso: npm test   (antes, una vez: npm install && npx playwright install chromium)
// No necesita Supabase: si config.js está vacío corre en modo práctica; si está completo,
// verifica que aparezca la caja de cuenta (no crea cuentas ni toca la base).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const checks = [];
function check(name, ok, detail) { checks.push({ name, ok, detail }); console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  → ' + detail)); }

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/jsdelivr|ERR_TUNNEL|ERR_INTERNET|net::ERR/.test(m.text())) errors.push(m.text()); });

  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const live = await page.evaluate(() => typeof LIVE !== 'undefined' && LIVE);
  console.log('Modo:', live ? 'EN VIVO (config.js completo y supabase-js cargado)' : 'práctica');

  check('10 secciones renderizadas', (await page.locator('section.sec').count()) === 10);
  check('fuentes cargadas', await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check("16px 'Google Sans Flex'") && document.fonts.check("16px 'Roboto Mono'"); }));
  check('mapa SVG con 6 puntos', (await page.locator('#map g.pin').count()) === 6);

  await page.click('g.pin[data-id="pampa"]');
  await page.waitForTimeout(200);
  check('tocar un punto del mapa abre su panel', (await page.locator('#panel').innerText()).includes('La barrera más famosa'));

  check('antes/después con control deslizable', (await page.locator('#ba input[type=range]').count()) === 1);
  check('5 pasos de obra', (await page.locator('#steps article.step').count()) === 5);

  await page.click('#int-disenar');
  await page.waitForTimeout(200);
  check('elegir un interés marca oficios "Para vos"', (await page.locator('#groups .of.hit').count()) >= 1);

  const tv = await page.locator('#tv').innerText();
  if (live) check('trivia pide crear cuenta', tv.includes('Crear cuenta'), tv.slice(0, 80));
  else check('trivia en modo práctica avisa que falta Supabase', tv.includes('no está conectada'), tv.slice(0, 80));

  const sv = await page.locator('#survey').innerHTML();
  if (live) check('encuesta pide cuenta', sv.includes('Crear cuenta'));
  else check('encuesta en modo práctica abre el Google Form', sv.includes('forms.gle'));

  await page.goto(base + '/#anfitrion', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const host = await page.locator('#host').innerText();
  check('panel #anfitrion visible', await page.locator('#host').isVisible() && host.length > 20, host.slice(0, 80));

  check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));

  await page.screenshot({ path: path.join(__dirname, 'ultima-corrida.png'), fullPage: false });
  await browser.close();
  srv.close();
  const failed = checks.filter(c => !c.ok).length;
  console.log(failed ? `\n${failed} chequeo(s) fallaron` : '\nTodo ok');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
