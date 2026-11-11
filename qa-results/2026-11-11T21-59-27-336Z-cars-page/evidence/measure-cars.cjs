// Re-measures, for this run, what the spec rows do not cover: selection colours and contrast (light/dark),
// checkbox geometry, menu focus fill, menu-to-trigger gap, trash glyph paths and the VIN font.
// Usage: node measure-cars.cjs  (needs the visual preview on :5175)
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

// In-page helpers: resolve an element's effective (composited) background and compute WCAG contrast.
const pageFns = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const toRgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const col = (c) => { const p = parse(c); return p && !Number.isNaN(p[0]) ? p : toRgb(c); };
  const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
  const effBg = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) stack.push(col(getComputedStyle(e).backgroundColor)); let c = [255, 255, 255, 1];
    const root = col(getComputedStyle(document.body).backgroundColor); if (root[3] > 0) c = over(root, c);
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i][3] > 0) c = over(stack[i], c); return c; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  window.__m = (sel, textSel) => { const el = document.querySelector(sel); if (!el) return null; const t = textSel ? document.querySelector(textSel) : el; const cs = getComputedStyle(el), ts = getComputedStyle(t);
    const bg = effBg(el), fg = col(ts.color); const r = el.getBoundingClientRect();
    return { bg: hex(bg), rawBg: cs.backgroundColor, fg: hex(fg), contrast: ratio(over(fg, bg), bg), fontWeight: ts.fontWeight, fontFamily: ts.fontFamily, w: +r.width.toFixed(2), h: +r.height.toFixed(2), borderColor: cs.borderTopColor, borderRadius: cs.borderTopLeftRadius }; };
  window.__fill = (sel) => { const el = document.querySelector(sel); return el ? hex(effBg(el)) : null; };
  window.__ratio = (a, b) => ratio(col(a), col(b));
};

(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const theme of ['light', 'dark']) {
    for (const [label, row, height] of [['open-row-2', 2, 900], ['flip-row-10', 10, 760]]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
      await ctx.route('**/api/**', (route) => { const u = new URL(route.request().url());
        if (u.pathname === '/api/brands/options') return route.fulfill({ json: brandOptions });
        if (u.pathname === '/api/cars') return route.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) });
        return route.abort(); });
      const page = await ctx.newPage(); const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`http://localhost:5175/visual/preview.html?scenario=cars-list-${theme}`);
      await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.waitForTimeout(300);
      await page.evaluate(pageFns);
      const k = `${theme}`;
      if (label === 'open-row-2') {
        // Selection: check row 1, move the pointer away, let transitions settle.
        await page.click('.p-datatable-tbody > tr:nth-child(1) .p-checkbox'); await page.hover('h1'); await page.waitForTimeout(600);
        out[k] = {
          selectedRow: await page.evaluate(() => window.__m('.p-datatable-tbody > tr:first-child > td:nth-child(2)')),
          selectedRowTr: await page.evaluate(() => getComputedStyle(document.querySelector('.p-datatable-tbody > tr:first-child')).backgroundColor),
          activePage: await page.evaluate(() => window.__m('.p-paginator-page-selected')),
          idlePage: await page.evaluate(() => window.__m('.p-paginator-page:not(.p-paginator-page-selected)')),
          checkedBox: await page.evaluate(() => window.__m('.p-datatable-tbody > tr:first-child .p-checkbox-box', '.p-datatable-tbody > tr:first-child .p-checkbox-icon')),
          checkedIcon: await page.$eval('.p-datatable-tbody > tr:first-child .p-checkbox-icon', (e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, color: getComputedStyle(e).color }; }),
          checkedRoot: await rect(page, '.p-datatable-tbody > tr:first-child .p-checkbox'),
          uncheckedBox: await page.evaluate(() => window.__m('.p-datatable-tbody > tr:nth-child(2) .p-checkbox-box')),
          headerBox: await page.evaluate(() => window.__m('.p-datatable-thead .p-checkbox-box')),
          bulkButton: await page.evaluate(() => window.__m('.p-button-danger.p-button-outlined')),
          checkboxVsRowContrast: await page.evaluate(() => window.__ratio(getComputedStyle(document.querySelector('.p-datatable-tbody > tr:first-child .p-checkbox-box')).backgroundColor, window.__fill('.p-datatable-tbody > tr:first-child > td:nth-child(2)'))),
        };
        await page.click('.p-datatable-tbody > tr:nth-child(1) .p-checkbox'); await page.hover('h1'); await page.waitForTimeout(400);
      }
      await page.click(trig(row)); await page.locator('.p-menu-overlay').waitFor(); await page.hover('h1'); await page.waitForTimeout(600);
      const t = await rect(page, trig(row)), m = await rect(page, '.p-menu-overlay');
      const opensUp = m.bottom <= t.y;
      out[`${k}:${label}`] = { trigger: t, menu: { w: m.w, h: m.h, x: m.x, y: m.y, bottom: m.bottom }, opensUp,
        gapPx: +(opensUp ? t.y - m.bottom : m.y - t.bottom).toFixed(2), overlap: !(m.bottom <= t.y || m.y >= t.bottom),
        focusedItems: await page.$$eval('.p-menu-overlay .p-menu-item', (els) => els.map((e) => ({ label: e.textContent.trim(), focused: e.classList.contains('p-focus') || e.getAttribute('data-p-focused') === 'true', contentBg: getComputedStyle(e.querySelector('.p-menu-item-content') || e).backgroundColor }))),
        trashPaths: await page.$eval('.p-menu-overlay .p-menu-item:nth-child(3) svg', (e) => e.querySelectorAll('path,line,rect,polyline').length),
        consoleErrors: errors };
      if (label === 'open-row-2') {
        // Keyboard focus on an item, to read PrimeVue's focus fill (Figma has no focus/hover token on node 2069:3601).
        await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400);
        out[`${k}:${label}`].afterArrowDown = await page.$$eval('.p-menu-overlay .p-menu-item', (els) => els.map((e) => ({ label: e.textContent.trim(), focused: e.classList.contains('p-focus'), contentBg: getComputedStyle(e.querySelector('.p-menu-item-content') || e).backgroundColor })));
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        // VIN font in the details dialog.
        await page.click(trig(1)); await page.locator('.p-menu-overlay').waitFor();
        await page.click('.p-menu-overlay .p-menu-item:nth-child(1) .p-menu-item-link'); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(500);
        out[k].vin = await page.$eval('.p-dialog-content > section:nth-of-type(1) dl > div:nth-child(3) dd', (e) => { const cs = getComputedStyle(e); return { text: e.textContent.trim(), fontFamily: cs.fontFamily, fontSize: cs.fontSize, lineHeight: cs.lineHeight }; });
      }
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(__dirname + '/cars-measurements.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})();
