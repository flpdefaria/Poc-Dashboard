// Attempt 02: flip/drop geometry at 720/760/900 in both themes, whole-pixel position, Trash2 glyph on the non-card Brands menu.
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const req = createRequire(CA + 'package.json'); const { chromium } = req('@playwright/test'); const fs = require('fs');
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items.filter((c) => c.model !== 'Corolla');
const bo = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const brands = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brands.json')).items;
const paged = (items, page, size) => ({ items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: items.length, totalPages: Math.ceil(items.length / size), hasPrevious: page > 1, hasNext: page * size < items.length });
const trig = (r) => `.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`;
(async () => {
  const b = await chromium.launch(); const out = { cars: {}, brands: {} };
  for (const theme of ['light', 'dark']) for (const [h, row] of [[720, 10], [760, 10], [900, 2], [900, 9]]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/brands/options') return r.fulfill({ json: bo }); return r.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) }); });
    const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await p.goto(`http://localhost:5175/visual/preview.html?scenario=cars-list-${theme}`); await p.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await p.waitForTimeout(300);
    await p.click(trig(row)); await p.waitForSelector('.p-menu-overlay'); await p.mouse.move(5, 5); await p.waitForTimeout(600);
    out.cars[`${theme}-${h}-row${row}`] = await p.evaluate((sel) => { const m = document.querySelector('.p-menu-overlay'); const t = document.querySelector(sel).getBoundingClientRect(); const r = m.getBoundingClientRect();
      const above = r.bottom <= t.top;
      return { styleTop: m.style.top, styleInsetInlineStart: m.style.insetInlineStart, marginTop: m.style.marginTop, menu: { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom, right: r.right }, trigger: { top: t.top, bottom: t.bottom, right: t.right },
        direction: above ? 'up' : 'down', gap: +(above ? t.top - r.bottom : r.top - t.bottom).toFixed(2), overlap: r.bottom > t.top && r.top < t.bottom, rightEdgeDelta: +(r.right - t.right).toFixed(2),
        wholePx: Number.isInteger(r.top) && Number.isInteger(r.left), inViewport: r.top >= 0 && r.bottom <= innerHeight }; }, trig(row));
    out.cars[`${theme}-${h}-row${row}`].errors = errors;
    await ctx.close();
  }
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); return r.fulfill({ json: paged(brands, +u.searchParams.get('page') || 1, +u.searchParams.get('pageSize') || 10) }); });
    const p = await ctx.newPage(); await p.goto(`http://localhost:5175/visual/preview.html?scenario=brands-page-${theme}`); await p.locator('.p-datatable-tbody > tr').first().waitFor(); await p.waitForTimeout(300);
    await p.click(trig(1)); await p.waitForSelector('.p-menu-overlay'); await p.waitForTimeout(500);
    out.brands[theme] = await p.$$eval('.p-menu-overlay .p-menu-item svg', (els) => els.map((e) => ({ cls: e.getAttribute('class'), paths: e.querySelectorAll('path,line,rect,circle,polyline').length, sw: e.getAttribute('stroke-width'), size: e.getBoundingClientRect().width })));
    out.brands[theme + 'Trigger'] = await p.$eval(`${trig(1)} svg`, (e) => ({ cls: e.getAttribute('class'), sw: e.getAttribute('stroke-width'), size: e.getBoundingClientRect().width }));
    await ctx.close();
  }
  await b.close(); console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
