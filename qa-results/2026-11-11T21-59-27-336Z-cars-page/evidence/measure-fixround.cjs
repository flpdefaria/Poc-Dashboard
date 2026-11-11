// Attempt 03 (fix round for the 9 strict-QA mismatches): measures each claimed fix on the live preview.
// Usage: PORT=5185 node measure-fixround.cjs  (needs `npm run dev -- --config visual/vite.config.ts --port $PORT`)
const { createRequire } = require('module');
const CA = '/Users/felipefaria/projects/poc-dashboard/Src/CarStore.Web/ClientApp/';
const req = createRequire(CA + 'package.json');
const { chromium } = req('@playwright/test');
const fs = require('fs');
const PORT = process.env.PORT || '5175';
const cars = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/cars.json')).items.filter((c) => c.model !== 'Corolla');
const brandOptions = JSON.parse(fs.readFileSync(CA + 'visual/scenarios/fixtures/brand-options.json'));
const paged = (items, page, size) => { const t = items.length, tp = Math.max(1, Math.ceil(t / size));
  return { items: items.slice((page - 1) * size, page * size), pageNumber: page, pageSize: size, totalItems: t, totalPages: tp, hasPrevious: page > 1, hasNext: page < tp }; };
const trig = (r) => `.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`;
const rect = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; });
const box = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  return { w: r.width, h: r.height, bg: cs.backgroundColor, border: cs.borderTopColor, borderWidth: cs.borderTopWidth, radius: cs.borderTopLeftRadius, shadow: cs.boxShadow,
    outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, outlineOffset: cs.outlineOffset, color: cs.color }; });
const svgInfo = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect();
  return { w: r.width, h: r.height, color: getComputedStyle(e).color, paths: e.querySelectorAll('path,line,rect,polyline').length,
    d: [...e.querySelectorAll('path')].map((p) => p.getAttribute('d')) }; });

async function newPage(browser, theme, height = 900) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
  await ctx.route('**/api/**', (route) => { const u = new URL(route.request().url());
    if (u.pathname === '/api/brands/options') return route.fulfill({ json: brandOptions });
    if (u.pathname === '/api/cars') return route.fulfill({ json: paged(cars, +u.searchParams.get('page') || 1, +u.searchParams.get('pageSize') || 10) });
    return route.abort(); });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${PORT}/visual/preview.html?scenario=cars-list-${theme}`);
  await page.locator('.p-datatable-tbody > tr').nth(9).waitFor(); await page.waitForTimeout(400);
  return { ctx, page, errors };
}

const dialogFocus = (page) => page.evaluate(() => {
  const d = document.querySelector('.p-dialog'); const c = d.querySelector('.p-dialog-close-button'); const a = document.activeElement; const cs = getComputedStyle(c);
  const as = getComputedStyle(a);
  return { active: `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}.${[...a.classList].slice(0, 3).join('.')}`, activeText: (a.textContent || '').trim().slice(0, 30),
    activeTabindex: a.getAttribute('tabindex'), activeAutofocus: a.hasAttribute('autofocus'), activeFocusVisible: a.matches(':focus-visible'),
    activeOutline: `${as.outlineStyle} ${as.outlineWidth}`, activeIsClose: a === c, closeFocusVisible: c.matches(':focus-visible'),
    closeOutline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
});
const activeDesc = (page) => page.evaluate(() => { const a = document.activeElement; const d = document.querySelector('.p-dialog');
  return { tag: a.tagName.toLowerCase(), id: a.id || null, cls: [...a.classList].slice(0, 3).join('.'), isClose: !!d && a === d.querySelector('.p-dialog-close-button'),
    inDialog: !!d && d.contains(a), focusVisible: a.matches(':focus-visible'), outline: `${getComputedStyle(a).outlineStyle} ${getComputedStyle(a).outlineWidth} ${getComputedStyle(a).outlineColor}` }; });

async function keyboardFlow(page, name, open) {
  await open(); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(700);
  const r = { onOpen: await dialogFocus(page), tabs: [] };
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(250); r.tabs.push(await activeDesc(page)); }
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  r.closedByEsc = (await page.locator('.p-dialog').count()) === 0;
  return r;
}

(async () => {
  const browser = await chromium.launch(); const out = {};
  for (const theme of ['light', 'dark']) {
    const o = (out[theme] = {});
    // Items 1-4: checkbox states and bulk button.
    let { ctx, page, errors } = await newPage(browser, theme);
    o.headerCheckbox = { root: await box(page, '.p-datatable-thead .p-checkbox'), box: await box(page, '.p-datatable-thead .p-checkbox-box') };
    o.uncheckedRow = { root: await box(page, '.p-datatable-tbody > tr:nth-child(2) .p-checkbox'), box: await box(page, '.p-datatable-tbody > tr:nth-child(2) .p-checkbox-box') };
    await page.click('.p-datatable-tbody > tr:nth-child(1) .p-checkbox'); await page.hover('h1'); await page.waitForTimeout(700);
    o.checkedRow = { root: await box(page, '.p-datatable-tbody > tr:nth-child(1) .p-checkbox'), box: await box(page, '.p-datatable-tbody > tr:nth-child(1) .p-checkbox-box'),
      icon: await svgInfo(page, '.p-datatable-tbody > tr:nth-child(1) .p-checkbox-icon') };
    o.uncheckedRowAfter = await box(page, '.p-datatable-tbody > tr:nth-child(2) .p-checkbox-box');
    o.bulkButton = { button: await box(page, '.p-button-danger.p-button-outlined'), label: await box(page, '.p-button-danger.p-button-outlined .p-button-label'),
      text: await page.textContent('.p-button-danger.p-button-outlined'), icon: await svgInfo(page, '.p-button-danger.p-button-outlined svg') };
    // Item 3: keyboard focus-visible ring on an unchecked checkbox (focus row 1 input, then Tab to row 2 input).
    await page.focus('.p-datatable-tbody > tr:nth-child(1) .p-checkbox-input');
    await page.keyboard.press('Tab'); await page.waitForTimeout(700);
    o.focusVisibleUnchecked = await page.evaluate(() => { const a = document.activeElement; const b = a.closest('.p-checkbox')?.querySelector('.p-checkbox-box'); const cs = b && getComputedStyle(b);
      return { activeIsCheckboxInput: a.classList.contains('p-checkbox-input'), row: [...a.closest('tbody')?.children || []].indexOf(a.closest('tr')) + 1, focusVisible: a.matches(':focus-visible'),
        outline: cs && `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, outlineOffset: cs && cs.outlineOffset, border: cs && cs.borderTopColor, shadow: cs && cs.boxShadow }; });
    // Item 3: hover border on unchecked (Aura hover rule vs unlayered override).
    await page.hover('.p-datatable-tbody > tr:nth-child(3) .p-checkbox'); await page.waitForTimeout(700);
    o.hoverUnchecked = await box(page, '.p-datatable-tbody > tr:nth-child(3) .p-checkbox-box');
    // Item 5: list-mode bulk dialog footer button.
    await page.hover('h1'); await page.click('.p-datatable-thead .p-checkbox'); await page.waitForTimeout(300);
    await page.click('button:has-text("Excluir selecionados")'); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(700);
    o.bulkDialog = { onOpen: await dialogFocus(page), confirmText: (await page.textContent('.p-dialog-footer button:last-child')).trim(), confirmIcon: await svgInfo(page, '.p-dialog-footer button:last-child svg') };
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    o.bulkDialog.closedByEsc = (await page.locator('.p-dialog').count()) === 0;
    o.consoleErrors = errors; await ctx.close();

    // Item 5 + 9: row menu down (row 2, 900px) and up (row 10, 760px).
    for (const [label, row, height] of [['menuDown', 2, 900], ['menuUp', 10, 760]]) {
      ({ ctx, page, errors } = await newPage(browser, theme, height));
      await page.click(trig(row)); await page.locator('.p-menu-overlay').waitFor(); await page.hover('h1'); await page.waitForTimeout(700);
      const t = await rect(page, trig(row)), m = await rect(page, '.p-menu-overlay'); const up = m.bottom <= t.y;
      o[label] = { trigger: t, menu: m, opensUp: up, gapPx: +(up ? t.y - m.bottom : m.y - t.bottom).toFixed(2), menuWholePx: Number.isInteger(m.y) && Number.isInteger(m.x),
        overlap: !(m.bottom <= t.y || m.y >= t.bottom), trash: await svgInfo(page, '.p-menu-overlay .p-menu-item:nth-child(3) svg'),
        iconsPaths: await page.$$eval('.p-menu-overlay .p-menu-item svg', (els) => els.map((e) => e.querySelectorAll('path,line,rect,polyline,circle').length)), consoleErrors: errors };
      await ctx.close();
    }

    // Items 6-8: dialogs.
    ({ ctx, page, errors } = await newPage(browser, theme));
    const viaMenu = (item) => async () => { await page.click(trig(1)); await page.locator('.p-menu-overlay').waitFor(); await page.click(`.p-menu-overlay .p-menu-item:has-text("${item}")`); };
    o.create = await keyboardFlow(page, 'create', () => page.click('button:has-text("Novo carro")'));
    // chevron (reopen to read the static state)
    for (const [k, open] of [['createChevron', () => page.click('button:has-text("Novo carro")')], ['editChevron', viaMenu('Editar')]]) {
      await open(); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(700);
      o[k] = await page.$eval('.p-dialog .p-select-dropdown svg', (e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, color: getComputedStyle(e).color, cls: e.getAttribute('class') }; });
      await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    }
    o.edit = await keyboardFlow(page, 'edit', viaMenu('Editar'));
    o.details = await keyboardFlow(page, 'details', viaMenu('Detalhes'));
    await viaMenu('Detalhes')(); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(800);
    o.vin = await page.evaluate(async () => { await document.fonts.ready; const dd = document.querySelector('.p-dialog-content dd.font-mono'); const cs = getComputedStyle(dd);
      const faces = []; document.fonts.forEach((f) => { if (/roboto mono/i.test(f.family)) faces.push({ family: f.family, weight: f.weight, style: f.style, status: f.status, unicodeRange: f.unicodeRange.slice(0, 40) }); });
      return { text: dd.textContent.trim(), fontFamily: cs.fontFamily, fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontWeight: cs.fontWeight, color: cs.color,
        fontsCheck: document.fonts.check('12px "Roboto Mono"'), fontsCheckText: document.fonts.check('12px "Roboto Mono"', dd.textContent.trim()), faces }; });
    // Which font Chromium actually used for the VIN glyphs (CDP platform fonts).
    const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.p-dialog-content dd.font-mono' });
    o.vin.platformFonts = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    o.delete = await keyboardFlow(page, 'delete', viaMenu('Excluir'));
    await viaMenu('Excluir')(); await page.locator('.p-dialog').waitFor(); await page.waitForTimeout(700);
    o.deleteConfirmIcon = await svgInfo(page, '.p-dialog-footer button:last-child svg'); o.deleteConfirmText = (await page.textContent('.p-dialog-footer button:last-child')).trim();
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    o.dialogConsoleErrors = errors; await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(__dirname + '/fixround-measurements.json', JSON.stringify(out, null, 1));
  console.log('written');
})();
