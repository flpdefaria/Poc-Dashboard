// Measures the Cars second-pass claims on the visual preview (port 5175) with hand-declared mocks.
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
const out = {};
async function open(browser, theme, height = 900) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC' });
  await ctx.clock.setFixedTime(new Date('2026-11-10T12:00:00Z'));
  await ctx.route('**/api/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/api/brands/options') return route.fulfill({ json: brandOptions });
    if (u.pathname === '/api/cars') return route.fulfill({ json: paged(cars, +u.searchParams.get('page'), +u.searchParams.get('pageSize')) });
    return route.abort();
  });
  const page = await ctx.newPage();
  const errors = []; page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://localhost:5175/visual/preview.html?scenario=cars-list-${theme}`);
  await page.locator('.p-datatable-tbody > tr').nth(9).waitFor();
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}
const trig = (r) => `.p-datatable-tbody > tr:nth-child(${r}) button[aria-label="Ações da linha"]`;
const rect = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; });
const style = (page, sel, props) => page.$eval(sel, (e, props) => { const cs = getComputedStyle(e); return Object.fromEntries(props.map((p) => [p, cs[p]])); }, props);
const svgStroke = (page, sel) => page.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); const sw = parseFloat(e.getAttribute('stroke-width'));
  const vb = (e.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number)[2]; return { cls: e.getAttribute('class'), size: `${r.width}x${r.height}`, attr: sw, effectivePx: +(sw * r.width / vb).toFixed(3), color: getComputedStyle(e).color, paths: e.querySelectorAll('path,line,rect,circle,polyline').length }; }));
(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const o = (out[theme] = {});
    let { ctx, page, errors } = await open(browser, theme);
    o.rootHeight = (await rect(page, '#preview-root > div')).h;
    o.card = await rect(page, 'div:has(> .p-datatable)');
    o.row1 = await rect(page, '.p-datatable-tbody > tr:nth-child(1)');
    o.trigger2Closed = { rect: await rect(page, trig(2)), ...(await style(page, trig(2), ['backgroundColor', 'color'])), ariaExpanded: await page.getAttribute(trig(2), 'aria-expanded') };
    o.row2Closed = await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor']);
    // paginator
    o.paginator = { rect: await rect(page, '.p-paginator'), ...(await style(page, '.p-paginator', ['justifyContent', 'gap', 'paddingTop', 'paddingBottom', 'borderBottomWidth'])) };
    o.paginator.card = await rect(page, 'div:has(> .p-datatable)');
    const pr = o.paginator.rect; const card = o.paginator.card;
    const kids = await page.$$eval('.p-paginator > *', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [e.className.split(' ')[0], r.x, r.right]; }));
    o.paginator.children = kids; const left = Math.min(...kids.map((k) => k[1])), right = Math.max(...kids.map((k) => k[2]));
    o.paginator.centreOffset = +(((left + right) / 2) - (card.x + card.w / 2)).toFixed(2);
    o.paginator.pageReport = await page.locator('.p-paginator-current').count();
    o.activePage = { rect: await rect(page, '.p-paginator-page-selected'), ...(await style(page, '.p-paginator-page-selected', ['backgroundColor', 'color', 'fontWeight', 'fontSize', 'borderRadius'])) };
    o.idlePage = await style(page, '.p-paginator-page:not(.p-paginator-page-selected)', ['backgroundColor', 'color', 'fontWeight']);
    o.navIcons = await svgStroke(page, '.p-paginator-first svg, .p-paginator-prev svg, .p-paginator-next svg, .p-paginator-last svg');
    o.navButton = { rect: await rect(page, '.p-paginator-next') };
    o.rppLabel = await style(page, '.p-paginator .p-select-label', ['color', 'fontSize']);
    o.rppChevron = await svgStroke(page, '.p-paginator .p-select-dropdown svg');
    o.rppSelect = await rect(page, '.p-paginator .p-select');
    // hover idle page
    await page.hover('.p-paginator-page:text-is("2")'); await page.waitForTimeout(600);
    o.idlePageHover = await style(page, '.p-paginator-page:text-is("2")', ['backgroundColor', 'color']);
    await page.hover('.p-paginator-page-selected'); await page.waitForTimeout(600);
    o.activePageHover = await style(page, '.p-paginator-page-selected', ['backgroundColor', 'color']);
    await page.mouse.move(5, 5); await page.waitForTimeout(600);
    o.idlePageAfterHover = await style(page, '.p-paginator-page:text-is("2")', ['backgroundColor']);
    // menu open on row 2
    await page.click(trig(2)); await page.waitForSelector('.p-menu-overlay'); await page.mouse.move(5, 5); await page.waitForTimeout(600);
    const m = await rect(page, '.p-menu-overlay'); const t = await rect(page, trig(2));
    o.menuOpen = { menu: m, trigger: t, rightEdgeDelta: +(m.right - t.right).toFixed(2), gapBelow: +(m.y - t.bottom).toFixed(2),
      menuStyle: await style(page, '.p-menu-overlay', ['borderTopColor', 'backgroundColor', 'borderRadius', 'boxShadow']),
      list: await style(page, '.p-menu-list', ['paddingTop', 'paddingLeft', 'gap']),
      items: await page.$$eval('.p-menu-overlay .p-menu-item-link', (els) => els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const lab = e.querySelector('.p-menu-item-label');
        return { text: e.innerText.trim(), h: r.height, w: r.width, padding: cs.padding, gap: cs.gap, color: getComputedStyle(lab).color, fontWeight: getComputedStyle(lab).fontWeight, fontSize: getComputedStyle(lab).fontSize }; })),
      itemTops: await page.$$eval('.p-menu-overlay .p-menu-item', (els) => els.map((e) => e.getBoundingClientRect().y)),
      icons: await svgStroke(page, '.p-menu-overlay .p-menu-item svg'),
      iconClasses: await page.$$eval('.p-menu-overlay .p-menu-item svg', (els) => els.map((e) => e.getAttribute('class'))),
      row2: await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor', 'color']),
      row1: await style(page, '.p-datatable-tbody > tr:nth-child(1)', ['backgroundColor']),
      trigger: { ...(await style(page, trig(2), ['backgroundColor', 'color'])), aria: await page.getAttribute(trig(2), 'aria-expanded') },
      triggerIcon: await svgStroke(page, `${trig(2)} svg`),
      expandedCount: await page.locator('button[aria-label="Ações da linha"][aria-expanded="true"]').count() };
    // close via trigger toggle
    await page.click(trig(2)); await page.waitForTimeout(600);
    o.afterToggleClose = { menus: await page.locator('.p-menu-overlay').count(), aria: await page.getAttribute(trig(2), 'aria-expanded'),
      row2: await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor']), trigger: await style(page, trig(2), ['backgroundColor']) };
    // open row 2, then click trigger of row 3 while open
    await page.click(trig(2)); await page.waitForSelector('.p-menu-overlay'); await page.waitForTimeout(400);
    await page.click(trig(6)); await page.waitForTimeout(700);
    o.switchRow = { menus: await page.locator('.p-menu-overlay').count(), expanded: await page.$$eval('button[aria-label="Ações da linha"][aria-expanded="true"]', (els) => els.map((e) => e.closest('tr').rowIndex)),
      row2: await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor']), row6: await style(page, '.p-datatable-tbody > tr:nth-child(6)', ['backgroundColor']) };
    if (o.switchRow.menus) { const mm = await rect(page, '.p-menu-overlay'), tt = await rect(page, trig(6)); o.switchRow.rightEdgeDelta = +(mm.right - tt.right).toFixed(2); }
    await page.keyboard.press('Escape'); await page.mouse.click(700, 20); await page.waitForTimeout(600);
    o.afterOutsideClose = { menus: await page.locator('.p-menu-overlay').count(), expanded: await page.locator('button[aria-label="Ações da linha"][aria-expanded="true"]').count(),
      row2: await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor']), row6: await style(page, '.p-datatable-tbody > tr:nth-child(6)', ['backgroundColor']) };
    // Escape closes?
    await page.click(trig(2)); await page.waitForSelector('.p-menu-overlay'); await page.waitForTimeout(400);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    o.escape = { menus: await page.locator('.p-menu-overlay').count(), aria: await page.getAttribute(trig(2), 'aria-expanded'), focusOnTrigger: await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) };
    if (o.escape.menus) { await page.mouse.click(700, 20); await page.waitForTimeout(500); }
    // selected + open
    await page.click('.p-datatable-tbody > tr:nth-child(2) .p-checkbox'); await page.waitForTimeout(300);
    o.selectedClosed = await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor', 'color']);
    await page.click(trig(2)); await page.waitForSelector('.p-menu-overlay'); await page.mouse.move(5, 5); await page.waitForTimeout(600);
    o.selectedOpen = { row: await style(page, '.p-datatable-tbody > tr:nth-child(2)', ['backgroundColor', 'color']), trigger: await style(page, trig(2), ['backgroundColor']) };
    await page.mouse.click(700, 20); await page.waitForTimeout(500);
    o.errors = errors; await ctx.close();
    // flip near bottom
    ({ ctx, page, errors } = await open(browser, theme, 720));
    await page.click(trig(10)); await page.waitForSelector('.p-menu-overlay'); await page.waitForTimeout(600);
    { const mm = await rect(page, '.p-menu-overlay'), tt = await rect(page, trig(10));
      o.flip = { viewportH: 720, menu: mm, trigger: tt, opensAbove: mm.bottom <= tt.y, gapAbove: +(tt.y - mm.bottom).toFixed(2), rightEdgeDelta: +(mm.right - tt.right).toFixed(2), withinViewport: mm.y >= 0 && mm.bottom <= 720 }; }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
