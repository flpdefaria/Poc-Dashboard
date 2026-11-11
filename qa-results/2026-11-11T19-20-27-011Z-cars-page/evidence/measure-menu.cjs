// Re-takes the Cars row-menu geometry for this run (menu-to-trigger gap lives outside the capture root).
// Usage: node measure-menu.cjs  (needs the visual preview on :5175)
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const req = createRequire(CA + 'package.json');
const { chromium } = req('@playwright/test');
const fs = require('fs');
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items
  .filter((c) => c.model !== 'Corolla').map((c) => (c.model === '3 Series' ? { ...c, description: 'Sedã executivo compacto.' } : c));
const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const paged = (items, page, size) => { const t = items.length, tp = Math.max(1, Math.ceil(t / size));
  return { items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: t, totalPages: tp, hasPrevious: page > 1, hasNext: page < tp }; };
const trig = (r) => `.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`;
const rect = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; });
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const theme of ['light', 'dark']) for (const [label, row, height] of [['open-row-2', 2, 900], ['flip-row-10', 10, 760]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
    await ctx.route('**/api/**', (route) => { const u = new URL(route.request().url());
      if (u.pathname === '/api/brands/options') return route.fulfill({ json: brandOptions });
      if (u.pathname === '/api/cars') return route.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) });
      return route.abort(); });
    const page = await ctx.newPage(); const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://localhost:5175/visual/preview.html?scenario=cars-list-${theme}`);
    await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.waitForTimeout(300);
    await page.click(trig(row)); await page.locator('.p-menu-overlay').waitFor(); await page.hover('h1'); await page.waitForTimeout(600);
    const t = await rect(page, trig(row)), m = await rect(page, '.p-menu-overlay');
    const opensUp = m.bottom <= t.y;
    out[`${theme}:${label}`] = { trigger: t, menu: { w: m.w, h: m.h, x: m.x, y: m.y, bottom: m.bottom }, opensUp,
      gapPx: +(opensUp ? t.y - m.bottom : m.y - t.bottom).toFixed(2), overlap: !(m.bottom <= t.y || m.y >= t.bottom),
      menuInsideViewport: m.y >= 0 && m.bottom <= height,
      trashPaths: await page.$eval('.p-menu-overlay .p-menu-item:nth-child(3) svg', (e) => e.querySelectorAll('path,line,rect,polyline').length),
      consoleErrors: errors };
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(__dirname + '/menu-geometry.json', JSON.stringify(out, null, 1));
  for (const [k, v] of Object.entries(out)) console.log(k, 'menu', `${v.menu.w}x${v.menu.h}`, 'up', v.opensUp, 'gap', v.gapPx, 'overlap', v.overlap, 'inView', v.menuInsideViewport, 'trashPaths', v.trashPaths, 'errors', v.consoleErrors.length);
})();
