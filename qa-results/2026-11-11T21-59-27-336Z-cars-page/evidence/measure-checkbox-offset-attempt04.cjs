// Attempt 04, fix A: checkbox top inside 48px rows (header + all 10 body rows, unchecked and checked).
// Usage: PORT=5185 node measure-checkbox-offset-attempt04.cjs
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const { chromium } = createRequire(CA + 'package.json')('@playwright/test');
const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items;
(async () => { const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url());
    if (u.pathname === '/api/cars') return r.fulfill({ json: { items: cars.slice(0, 10), pageNumber: 1, pageSize: 10, totalItems: cars.length, totalPages: 4, hasPrevious: false, hasNext: true } }); return r.abort(); });
  const page = await ctx.newPage(); await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-light`);
  await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.waitForTimeout(300);
  const measure = () => page.evaluate(() => { const m = (row) => { const cell = row.querySelector('th, td'); const cb = row.querySelector('.p-checkbox'); const box = cb.querySelector('.p-checkbox-box') || cb; const rr = row.getBoundingClientRect(), b = cb.getBoundingClientRect(), bx = box.getBoundingClientRect(); const cs = getComputedStyle(cell), cbs = getComputedStyle(cb);
      return { rowH: rr.height, cbTopInRow: +(b.top - rr.top).toFixed(2), boxTopInRow: +(bx.top - rr.top).toFixed(2), cbBottomGap: +(rr.bottom - b.bottom).toFixed(2), cbSize: `${b.width}x${b.height}`, cellPadding: cs.padding, verticalAlign: cbs.verticalAlign, marginTop: cbs.marginTop, display: cbs.display }; };
    return { header: m(document.querySelector('.p-datatable-thead > tr')), body: [...document.querySelectorAll('.p-datatable-tbody > tr')].map(m) }; });
  const unchecked = await measure();
  await page.locator('.p-datatable-tbody > tr').nth(1).locator('.p-checkbox').click(); await page.waitForTimeout(400);
  const checked = await measure();
  const r = { figma: { header: '2070:1402 y=14.5', body: '2070:1951 y=14.5', rowH: 48 }, unchecked, checkedRow2: checked.body[1], allBodyRowsH: [...new Set(unchecked.body.map(b => b.rowH))], allBodyTops: [...new Set(unchecked.body.map(b => b.cbTopInRow))] };
  fs.writeFileSync(__dirname + '/checkbox-offset-measurements-attempt04.json', JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1)); await browser.close(); })();
