// Attempt 03, item 7: rendered glyph bounds of the Marca select chevron (Figma vector 8.05 x 4.55 in a 14px box).
// Usage: PORT=5185 node measure-chevron-glyph.cjs
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const { chromium } = createRequire(CA + 'package.json')('@playwright/test');
const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items;
const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
(async () => { const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/brands/options') return r.fulfill({ json: brandOptions });
    if (u.pathname === '/api/cars') return r.fulfill({ json: { items: cars.slice(0, 10), pageNumber: 1, pageSize: 10, totalItems: cars.length, totalPages: 4, hasPrevious: false, hasNext: true } }); return r.abort(); });
  const page = await ctx.newPage(); await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-light`);
  await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.click('button:has-text("Novo carro")'); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(600);
  const r = await page.$eval('.p-dialog .p-select-dropdown svg', (svg) => { const vb = svg.viewBox.baseVal; const s = svg.getBoundingClientRect().width / vb.width; const p = svg.querySelector('path'); const b = p.getBBox(); const cs = getComputedStyle(p);
    return { svg: `${svg.getBoundingClientRect().width}x${svg.getBoundingClientRect().height}`, viewBox: `${vb.width}x${vb.height}`, glyphPx: `${(b.width * s).toFixed(2)}x${(b.height * s).toFixed(2)}`,
      glyphOffset: `${(b.x * s).toFixed(2)},${(b.y * s).toFixed(2)}`, fill: cs.fill, stroke: cs.stroke, d: p.getAttribute('d').slice(0, 60) }; });
  r.figma = { node: 'I2075:5083;6195:16139;6195:7759;1075:17150', glyphPx: '8.05x4.55', glyphOffset: '2.98,4.73', box: '14x14' };
  fs.writeFileSync(__dirname + '/chevron-glyph-measurements.json', JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1)); await browser.close(); })();
