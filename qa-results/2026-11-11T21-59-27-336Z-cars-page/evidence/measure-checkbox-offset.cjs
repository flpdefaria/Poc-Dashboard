// Attempt 03, item 1: vertical offset of the 18px checkbox inside its 48px row/header cell.
// Usage: PORT=5185 node measure-checkbox-offset.cjs
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
  const r = await page.evaluate(() => { const m = (rowSel) => { const row = document.querySelector(rowSel); const cell = row.querySelector('th, td'); const cb = row.querySelector('.p-checkbox'); const rr = row.getBoundingClientRect(), cr = cell.getBoundingClientRect(), b = cb.getBoundingClientRect(); const cs = getComputedStyle(cell);
      return { rowTop: rr.top, rowH: rr.height, cbTopInRow: +(b.top - rr.top).toFixed(2), cbBottomGap: +(rr.bottom - b.bottom).toFixed(2), cbLeftInCell: +(b.left - cr.left).toFixed(2), cellPadding: cs.padding, cbVerticalAlign: getComputedStyle(cb).verticalAlign, cbDisplay: getComputedStyle(cb).display, cellLineHeight: cs.lineHeight }; };
    return { header: m('.p-datatable-thead > tr'), row1: m('.p-datatable-tbody > tr:nth-child(1)') }; });
  fs.writeFileSync(__dirname + '/checkbox-offset-measurements.json', JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1)); await browser.close(); })();
