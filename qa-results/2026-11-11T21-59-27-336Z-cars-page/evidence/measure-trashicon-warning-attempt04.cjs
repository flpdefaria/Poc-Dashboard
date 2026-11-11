// Attempt 04, fix C: open every card row menu (light + dark) and collect console warnings; a probe warn proves the listener works.
// Usage: PORT=5185 node measure-trashicon-warning-attempt04.cjs
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const { chromium } = createRequire(CA + 'package.json')('@playwright/test');
const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items;
(async () => { const browser = await chromium.launch(); const out = {};
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url());
      if (u.pathname === '/api/cars') return r.fulfill({ json: { items: cars.slice(0, 10), pageNumber: 1, pageSize: 10, totalItems: cars.length, totalPages: 4, hasPrevious: false, hasNext: true } }); return r.abort(); });
    const page = await ctx.newPage(); const msgs = []; page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) msgs.push(`${m.type()}: ${m.text().slice(0, 140)}`); });
    await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-${theme}`); await page.locator('.p-datatable-tbody > tr').nth(9).waitFor();
    await page.evaluate(() => console.warn('[probe] listener ok'));
    let opens = 0, trashPaths = [];
    for (let i = 1; i <= 10; i++) { const t = `.p-datatable-tbody > tr:nth-child(${i}) button[aria-label="Ações da linha"]`;
      await page.click(t); await page.locator('.p-menu-overlay').waitFor(); opens++;
      trashPaths.push(await page.$eval('.p-menu-overlay .p-menu-item:nth-child(3) svg', (s) => s.querySelectorAll('path,line,rect,polyline').length));
      await page.keyboard.press('Escape'); await page.locator('.p-menu-overlay').waitFor({ state: 'detached' }); }
    out[theme] = { menuOpens: opens, trashPathCounts: [...new Set(trashPaths)], vueWarnings: msgs.filter((m) => m.includes('Vue warn')), reactiveComponentWarnings: msgs.filter((m) => m.includes('made a reactive object')).length, allMessages: msgs };
    await ctx.close(); }
  fs.writeFileSync(__dirname + '/trashicon-warning-attempt04.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); await browser.close(); })();
