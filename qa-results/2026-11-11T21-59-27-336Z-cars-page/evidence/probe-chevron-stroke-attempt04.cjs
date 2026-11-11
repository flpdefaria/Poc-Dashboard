// Attempt 04, fix B follow-up (read-only DOM probe, no code change): ink of the Marca chevron at 1x for absolute strokes 1.5 / 1.25 / 1.0 vs the Figma PNG.
// Usage: PORT=5185 node probe-chevron-stroke-attempt04.cjs
const { createRequire } = require('module'); const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/'; const req = createRequire(CA + 'package.json');
const { chromium } = req('@playwright/test'); const { PNG } = req('pngjs'); const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items; const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const ink = (png, x0, y0) => { let s = 0, n = 0, bb = [1e9, 1e9, -1, -1]; for (let y = y0 - 2; y < y0 + 16; y++) for (let x = x0 - 2; x < x0 + 16; x++) { const i = (y * png.width + x) * 4; const c = 255 - png.data[i + 1]; if (c > 20) { s += c; n++; bb = [Math.min(bb[0], x - x0), Math.min(bb[1], y - y0), Math.max(bb[2], x - x0), Math.max(bb[3], y - y0)]; } } return { inkPx: n, inkSum: s, bbox: bb.join(',') }; };
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/brands/options') return r.fulfill({ json: brandOptions });
    if (u.pathname === '/api/cars') return r.fulfill({ json: { items: cars.slice(0, 10), pageNumber: 1, pageSize: 10, totalItems: 40, totalPages: 4, hasPrevious: false, hasNext: true } }); return r.abort(); });
  const p = await ctx.newPage(); await p.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-light`);
  await p.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await p.click('button:has-text("Novo carro")'); await p.locator('.p-dialog').waitFor(); await p.waitForTimeout(800); await p.mouse.move(0, 0);
  const out = { figma: ink(PNG.sync.read(fs.readFileSync(__dirname + '/../reference/cars-create-dialog-light.png')), 164, 266) };
  for (const px of [1.5, 1.25, 1.0]) { await p.$eval('.p-dialog .p-select-dropdown svg', (s, w) => s.setAttribute('stroke-width', String(w * 24 / 14)), px); await p.waitForTimeout(100);
    out[`stroke ${px}px`] = ink(PNG.sync.read(await p.locator('.p-dialog').screenshot()), 164, 266); }
  fs.writeFileSync(__dirname + '/chevron-stroke-probe-attempt04.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); await b.close(); })();
