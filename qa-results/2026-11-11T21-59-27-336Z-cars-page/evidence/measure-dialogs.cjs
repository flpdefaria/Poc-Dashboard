// Measures dialog details with no spec row: select chevron size, close-button focus ring on open, bulk dialog height.
// Usage: node measure-dialogs.cjs  (needs the visual preview on :5175)
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const req = createRequire(CA + 'package.json');
const { chromium } = req('@playwright/test');
const fs = require('fs');
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items.filter((c) => c.model !== 'Corolla');
const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const paged = (items, page, size) => { const t = items.length, tp = Math.max(1, Math.ceil(t / size));
  return { items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: t, totalPages: tp, hasPrevious: page > 1, hasNext: page < tp }; };
const probe = (page) => page.evaluate(() => {
  const d = document.querySelector('.p-dialog'); const c = d.querySelector('.p-dialog-close-button'); const cs = getComputedStyle(c);
  const chev = d.querySelector('.p-select-dropdown svg'); const r = d.getBoundingClientRect();
  return { dialogH: +r.height.toFixed(3), dialogY: +r.y.toFixed(3), activeIsClose: document.activeElement === c, closeFocusVisible: c.matches(':focus-visible'),
    closeOutline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, closeBorder: `${cs.borderTopWidth} ${cs.borderTopColor}`, closeShadow: cs.boxShadow,
    chevron: chev ? { w: chev.getBoundingClientRect().width, h: chev.getBoundingClientRect().height, color: getComputedStyle(chev).color } : null,
    rows: [...d.querySelectorAll('.p-dialog-header, .p-dialog-content, .p-dialog-footer')].map((e) => +e.getBoundingClientRect().height.toFixed(3)) };
});
(async () => {
  const browser = await chromium.launch(); const out = {};
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
    await ctx.route('**/api/**', (route) => { const u = new URL(route.request().url());
      if (u.pathname === '/api/brands/options') return route.fulfill({ json: brandOptions });
      if (u.pathname === '/api/cars') return route.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) });
      return route.abort(); });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:5175/visual/preview.html?scenario=cars-list-${theme}`);
    await page.locator('.p-datatable-tbody > tr').nth(9).waitFor();
    await page.click('button:has-text("Novo carro")'); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(600);
    out[`${theme}:create`] = await probe(page);
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await page.click('.p-datatable-thead .p-checkbox'); await page.click('button:has-text("Excluir selecionados")');
    await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(600);
    out[`${theme}:bulk`] = await probe(page);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(__dirname + '/dialog-measurements.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})();
