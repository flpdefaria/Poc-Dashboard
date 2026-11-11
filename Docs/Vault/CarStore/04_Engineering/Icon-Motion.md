---
type: guide
created: 2026-11-11
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# Icon Motion

Every Lucide icon inside an `icon-motion` host plays one short, icon-specific gesture on hover or keyboard focus,
ported 1:1 from the Atlas app.

## Context

Atlas (same `@lucide/vue` package, same SVG node order) animates its icons with one unscoped stylesheet,
`src/ClientApp/src/assets/icon-motion.css`. CarStore reuses that file so both apps feel the same. Each gesture
explains the icon (the house door swings, the key turns, the bell rings), runs once per interaction and settles
on the shared `--sbi-ease` curve `cubic-bezier(0.22, 1, 0.36, 1)`.

## Details

- File: `Src/CarStore.Web/ClientApp/src/styles/icon-motion.css`, imported once in `src/main.ts` right after
  `style.css`. Unscoped on purpose: the animated nodes are the `<path>`/`<circle>`/`<rect>` children Lucide renders,
  which a scoped block cannot reach. Rules are keyed on `.icon-motion:is(:hover, :focus-visible) .lucide-<name>`.
- Differences from Atlas: the host is only `.icon-motion` (Atlas also had `.sidebar-nav__link` and the sidebar
  chevron turn, which CarStore does not have). All Atlas gestures and `sbi-*` keyframes are kept unchanged.
- Hosts (where the class is applied):
  - Sidebar rows and footer buttons: `rowClass` / `selectedRowClass` in `common/sidebar/Sidebar.vue`.
  - Every button using `styles/buttonStyles.ts` (the three base classes carry `icon-motion`): page header
    "Novo ..." buttons, dialog footers, Home CTAs.
  - Modal close button: `pcCloseButton` in `modalDialogPt` (`common/dialog/dialogStyles.ts`).
  - `common/table/DataTableCommon.vue`: search `IconField`, sortable header cells (`flushColumnPt`,
    `cardColumnPt`), the row-actions kebab button, both row-menu `itemLink` pts.
  - Home KPI cards (`components/Home.vue`).
- CarStore-only gestures (own section in the file): `car` pulls forward while the body squats (`sbi-squat`),
  `id-card` text lines redraw and the holder nods, `palette` rocks and its paint dots dab in sequence (`sbi-dab`),
  `arrow-up-down` arrows trade places, `arrow-up`/`arrow-down` step in their direction, and the 3-path Figma
  `TrashIcon` lifts its lid (Lucide's own trash rule targets children 4-5, which that icon does not have).
- Adding an icon: write its gesture in `icon-motion.css` keyed on `.lucide-<name>` (check the child order in
  `node_modules/@lucide/vue/dist/esm/icons/<name>.mjs`), then make sure an ancestor has `icon-motion`.
- `.icon-arrive` (one-shot arrival on mount, from Atlas) is available but not used yet.
- `prefers-reduced-motion: reduce` disables every gesture; hover colour changes still give feedback.
- Verified in the running app (Development): sidebar, palette, theme, "Novo carro", search, sort header, kebab,
  row menu (Detalhes/Editar/Excluir) and the modal close button each start their gesture; idle icons have none;
  reduced motion removes them.

## Related

- [[Frontend-SPA]]
- [[Sidebar-Collapse-Expand]]
- [[Cars-Page]]
- [[Home-Dashboard]]
