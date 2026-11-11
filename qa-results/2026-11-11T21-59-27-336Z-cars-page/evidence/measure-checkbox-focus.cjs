// Attempt 03, item 3: keyboard focus-visible ring on card-mode checkboxes (Tab from the search field).
// Usage: PORT=5185 node measure-checkbox-focus.cjs
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const { chromium } = createRequire(CA + 'package.json')('@playwright/test');
const fs = require('fs'); const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items.filter((c) => c.model !== 'Corolla');
const paged = (items, page, size) => { const t = items.length, tp = Math.ceil(t / size); return { items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: t, totalPages: tp, hasPrevious: page > 1, hasNext: page < tp }; };
const probe = (page) => page.evaluate(() => { const a = document.activeElement; const cb = a.closest('.p-checkbox'); const b = cb && cb.querySelector('.p-checkbox-box'); const cs = b && getComputedStyle(b);
  const tr = a.closest('tr'); return { where: tr ? (tr.closest('thead') ? 'thead' : 'tbody row ' + ([...tr.parentElement.children].indexOf(tr) + 1)) : a.tagName, isCheckboxInput: a.classList.contains('p-checkbox-input'),
    checked: !!cb && cb.classList.contains('p-checkbox-checked'), focusVisible: a.matches(':focus-visible'), boxOutline: cs && `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, boxOutlineOffset: cs && cs.outlineOffset,
    boxBorder: cs && cs.borderTopColor, boxShadow: cs && cs.boxShadow, size: b && `${b.getBoundingClientRect().width}x${b.getBoundingClientRect().height}` }; });
(async () => { const browser = await chromium.launch(); const out = {};
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
    await ctx.route('**/api/**', (r) => { const u = new URL(r.request().url()); if (u.pathname === '/api/cars') return r.fulfill({ json: paged(cars, +u.searchParams.get('page') || 1, +u.searchParams.get('pageSize') || 10) }); return r.abort(); });
    const page = await ctx.newPage(); await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-${theme}`);
    await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.waitForTimeout(300);
    await page.focus('.p-iconfield input'); const seq = [];
    for (let i = 0; i < 12 && seq.filter((s) => s.isCheckboxInput).length < 2; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(700); const p = await probe(page); if (p.isCheckboxInput) seq.push(p); }
    // Checked + focused: Space on the focused row checkbox.
    await page.keyboard.press('Space'); await page.waitForTimeout(700); seq.push({ ...(await probe(page)), note: 'after Space' });
    out[theme] = seq; await ctx.close(); }
  await browser.close(); fs.writeFileSync(__dirname + '/checkbox-focus-measurements.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); })();
