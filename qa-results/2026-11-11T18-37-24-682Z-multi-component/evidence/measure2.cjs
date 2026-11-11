const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const req = createRequire(CA + 'package.json'); const { chromium } = req('@playwright/test'); const fs = require('fs');
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items.filter((c) => c.model !== 'Corolla');
const bo = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const paged = (items, page, size) => ({ items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: items.length, totalPages: Math.ceil(items.length / size), hasPrevious: page > 1, hasNext: page * size < items.length });
const trig = (r) => `.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`;
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const h of [720, 900]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/brands/options') return r.fulfill({ json: bo }); return r.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) }); });
    const p = await ctx.newPage(); await p.goto('http://localhost:5175/visual/preview.html?scenario=cars-list-light'); await p.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await p.waitForTimeout(300);
    const row = h === 720 ? 10 : 2;
    await p.click(trig(row)); await p.waitForSelector('.p-menu-overlay'); await p.waitForTimeout(600);
    out[h] = await p.evaluate((sel) => { const m = document.querySelector('.p-menu-overlay'); const t = document.querySelector(sel).getBoundingClientRect(); const r = m.getBoundingClientRect();
      return { transformOrigin: m.style.transformOrigin, marginTop: m.style.marginTop, top: m.style.top, insetInlineStart: m.style.insetInlineStart, menuTop: r.top, menuBottom: r.bottom, trigTop: t.top, trigBottom: t.bottom }; }, trig(row));
    // close via trigger and move mouse away
    await p.click(trig(row)); await p.mouse.move(700, 20); await p.waitForTimeout(600);
    out[h].afterToggleCloseMouseAway = await p.evaluate((r) => ({ row: getComputedStyle(document.querySelector(`.p-datatable-tbody > tr:nth-child(${r})`)).backgroundColor,
      trig: getComputedStyle(document.querySelector(`.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`)).backgroundColor,
      aria: document.querySelector(`.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`).getAttribute('aria-expanded') }), row);
    out[h].paginatorWrapper = await p.evaluate(() => { const w = document.querySelector('.p-datatable-paginator-bottom'); const cs = getComputedStyle(w); const r = w.getBoundingClientRect(); return { h: r.height, borderBottom: cs.borderBottomWidth + ' ' + cs.borderBottomColor, cls: w.className }; });
    await ctx.close();
  }
  await b.close(); console.log(JSON.stringify(out, null, 1));
})();
