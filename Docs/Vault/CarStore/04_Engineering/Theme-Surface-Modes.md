---
type: guide
created: 2026-11-10
updated: 2026-11-11
tags:
  - note
  - type/guide
  - area/engineering
  - component/web
---

# Theme: Monochrome Primary and Surface Modes

The SPA theme is modeled on the Atlas app (Prometheus design system): a monochrome primary that aliases the
surface scale, plus five user-selectable surface modes, in both light and dark.

## Context

Before this change the app ran plain Aura (emerald primary, slate surface) with a hand-tuned graphite ramp for
dark. The Atlas project (`~/projects/atlas`, `src/ClientApp/src/plugins/primevue-preset.ts`) was used as the
reference for the palette idea. Atlas switches surface modes with `updateSurfacePalette` and uses PrimeVue's
own dark mode; CarStore keeps `darkModeSelector: false` and does both in CSS instead, so the inverted dark
ramp, the pre-paint script and the preset stay in sync.

## Details

- **Preset** `ClientApp/src/plugins/primevue-preset.ts` -> `CarStorePreset` (Aura base, registered in
  `main.ts`). `--p-surface-N` = `var(--sm-N)`; `primary.N` = `{surface.N}`; `primary.color` = `primary.950`,
  `contrastColor` = `surface.0`, hover/active 800/700; `highlight` = solid `primary.950` on `surface.0`.
  `extend` adds `--p-soft-*`, `--p-layout-container/panel/subtle/divider`, `--p-highlight-pressed-background`.
  Exports `SURFACE_MODES`, `DEFAULT_SURFACE_MODE` (`gray`), `isSurfaceMode`.
- **Surface modes** `gray` (default), `neutral`, `slate`, `stone`, `zinc`: `style.css` maps
  `html[data-surface="<mode>"]` to `--sm-50…950` = `var(--p-<mode>-N)` (Aura primitives); `:root` falls back to
  gray, `--sm-0` = white.
- **Dark** (`html.app-dark` in `style.css`) inverts the surface scale from the active `--sm-*`: 0 = 950,
  50 = mix(950/900), 100 = 900, 200 = mix(900/800), 300 = 800, 400 = 600, 500 = 400, 600 = 300, 700 = 200,
  800 = 100, 900 = 50, 950 = white. Because primary aliases surface, the primary action/highlight become light
  fills with dark text without per-scheme tokens. The old tinted `--p-highlight-*` dark overrides were removed.
- **State** `composables/useTheme.ts` -> `{ theme, surface, toggle, setTheme, setSurface }`; persisted in
  `localStorage` `carstore-theme` / `carstore-surface`. `Views/Shared/_Layout.cshtml` applies `app-dark` and
  `data-surface` before first paint (its mode list must match `SURFACE_MODES`).
- **UI** `components/common/dialog/ThemeSettingsDialog.vue` (surface swatch strips only, live apply, Close
  only), opened by the sidebar "Aparência" row (`Palette` icon). Light/dark is switched only by the sidebar
  "Tema escuro" icon button (`Moon`/`Sun`, `toggle()` with the circular reveal); the dialog has no theme radios.
- **Charts** `common/chart/BarChart.vue` rebuilds on `theme` and `surface` changes; default bar color is
  `--p-primary-color` (now neutral). Dark `--p-surface-50/200` are `color-mix()` strings, so canvas code must
  read plain steps.
- Adding a mode: `SURFACE_MODES` + a `html[data-surface]` block + `SURFACE_LABELS` in the dialog + the
  `_Layout.cshtml` list.

## Figma alignment (2026-11-11)

- **Default mode:** gray stays the default. It is the mode the Figma frames resolve to (`get_variable_defs`).
  Read resolved values, never the fallbacks in `get_design_context` code.
- **Text tokens:** preset `text.color` = `{surface.800}` (Figma `text/color` `#1f2937`; Aura's default is
  700), `mutedColor` = `{surface.500}`.
- **ToggleButton tokens:**
  - track = `var(--color-sunken)` and content padding 4.5px / 10px
  - idle label `{surface.600}`, checked label `{surface.950}`
- **Tag info:** `{cyan.100}` / `{cyan.700}`. Dark overrides in `style.css` use cyan 400/300.
- **`--color-sunken`:** a new `@theme` token (`bg-sunken`). It is surface-50 in light and surface-100 in dark,
  because surface-50 is the card background there.
- **Typography:** Inter is self-hosted through `@fontsource/inter`, Latin + Latin Extended, weights
  400–700, as `--font-sans`. `html` uses grayscale smoothing (`antialiased`). ECharts gets the family
  explicitly in `BarChart.vue`.

## Related

- [[Frontend-SPA]]
- [[Sidebar-Collapse-Expand]]
- [[Home-Dashboard]]
