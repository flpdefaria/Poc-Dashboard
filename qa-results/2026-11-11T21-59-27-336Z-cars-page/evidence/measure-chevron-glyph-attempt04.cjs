// Attempt 04, fix B: Marca select chevron glyph (Lucide ChevronDown) in create and edit dialogs vs Figma 8.05x4.55 at 2.98,4.73 in 14px.
// Usage: PORT=5185 node measure-chevron-glyph-attempt04.cjs
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const { chromium } = createRequire(CA + 'package.json')('@playwright/test');
const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items;
const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
(async () => { const browser = await chromium.launch(); const out = { figma: { node: 'I2075:5083;6195:16139;6195:7759;1075:17150', glyphPx: '8.05x4.55', glyphOffset: '2.98,4.73', box: '14x14', stroke: '1.5px', color: '#6b7280' } };
  for (const [flow, theme] of [['create', 'light'], ['edit', 'light'], ['create', 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/brands/options') return r.fulfill({ json: brandOptions });
      const one = u.pathname.match(/^\/api\/cars\/(\d+)$/); if (one) return r.fulfill({ json: cars.find(c => String(c.id) === one[1]) || cars[0] });
      if (u.pathname === '/api/cars') return r.fulfill({ json: { items: cars.slice(0, 10), pageNumber: 1, pageSize: 10, totalItems: cars.length, totalPages: 4, hasPrevious: false, hasNext: true } }); return r.abort(); });
    const page = await ctx.newPage(); const warns = []; page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text().slice(0, 160)); });
    await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-${theme}`);
    await page.locator('.p-datatable-tbody > tr').nth(9).waitFor();
    if (flow === 'create') await page.click('button:has-text("Novo carro")');
    else { await page.click('.p-datatable-tbody > tr:nth-child(1) button[aria-label="Ações da linha"]'); await page.locator('.p-menu-overlay').waitFor(); await page.waitForTimeout(300); await page.locator('.p-menu-overlay .p-menu-item:has-text("Editar")').click(); }
    await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(700);
    const r = await page.$eval('.p-dialog .p-select-dropdown svg', (svg) => { const vb = svg.viewBox.baseVal; const rect = svg.getBoundingClientRect(); const s = rect.width / vb.width; const ps = [...svg.querySelectorAll('path, polyline')]; const p = ps[0]; const b = p.getBBox(); const cs = getComputedStyle(svg); const ds = svg.closest('.p-select-dropdown').getBoundingClientRect();
      return { cls: svg.getAttribute('class'), svg: `${rect.width}x${rect.height}`, viewBox: `${vb.width}x${vb.height}`, paths: ps.length, d: p.getAttribute('d'), glyphPx: `${(b.width * s).toFixed(2)}x${(b.height * s).toFixed(2)}`, glyphOffset: `${(b.x * s).toFixed(2)},${(b.y * s).toFixed(2)}`,
        strokeWidthAttr: svg.getAttribute('stroke-width'), strokeRenderedPx: +(parseFloat(svg.getAttribute('stroke-width')) * s).toFixed(3), stroke: cs.stroke, color: cs.color, fill: cs.fill, svgInDropdown: `${(rect.left - ds.left).toFixed(2)},${(rect.top - ds.top).toFixed(2)} of ${ds.width}x${ds.height}` }; });
    await page.locator('.p-dialog .p-select').first().click(); await page.waitForTimeout(500);
    r.opens = await page.locator('.p-select-overlay .p-select-option').count();
    r.expanded = await page.locator('.p-dialog .p-select [aria-expanded]').first().getAttribute('aria-expanded');
    await page.locator('.p-select-overlay .p-select-option').nth(1).click(); await page.waitForTimeout(300);
    r.selectedLabel = (await page.locator('.p-dialog .p-select-label').first().textContent()).trim();
    r.overlayClosed = (await page.locator('.p-select-overlay').count()) === 0;
    r.consoleWarnings = warns; out[`${flow}-${theme}`] = r;
    await page.locator('.p-dialog .p-select-dropdown').first().screenshot({ path: __dirname + `/chevron-${flow}-${theme}-attempt04.png`, scale: 'device' });
    await ctx.close(); }
  fs.writeFileSync(__dirname + '/chevron-glyph-measurements-attempt04.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); await browser.close(); })();
