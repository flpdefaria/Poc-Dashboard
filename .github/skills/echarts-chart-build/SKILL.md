---
name: echarts-chart-build
description: "Use when: adding a chart to ANY ClientApp page (Home or any other page/dialog), adding a new chart type (line, pie, multi-series bar, ...) not yet covered by an existing components/common/chart/ component, or restyling/extending one. `echarts` is already installed in this repo. This is the general, ongoing ECharts skill: every chart in the app must go through it so they all share one import strategy and one visual language."
argument-hint: "The page/component the chart goes in, the data it charts, and the chart type (bar/line/pie/...)"
---

# ECharts chart build

Builds (or extends) an ECharts chart component in `Src/CarStore.Web/ClientApp/src/components/common/chart/`
so every chart in the app - regardless of page or chart type - shares the same library, the same tree-shaken
import strategy, and the same PrimeVue-token-driven look. Reference implementation and the pattern to copy:
`common/chart/BarChart.vue` (built for the Home dashboard's "New customers" chart). Handbook reference for the
import/lifecycle approach: https://echarts.apache.org/handbook/en/get-started/

## Reuse before creating

1. Check `components/common/chart/` first. If a component there already matches the chart type AND the prop
   shape you need (e.g. `labels: string[]` + `values: number[]` for a single-series bar), reuse it directly -
   do not create a near-duplicate.
2. Only add a new component when the chart type genuinely differs (line, pie, multi-series bar, scatter, ...)
   or the data shape is fundamentally different (e.g. a pie needs `{ name, value }[]`, not parallel arrays).
3. Name new components `<Type>Chart.vue` (`LineChart.vue`, `PieChart.vue`, `StackedBarChart.vue`, ...) -
   generic by chart type, never by the entity/page that first needed it (no `CustomersChart.vue`,
   `RevenueChart.vue`). The component must stay domain-agnostic so any future page can reuse it.

## Placement

`components/common/chart/<Type>Chart.vue` - always `common/`, never directly under `components/` or inside a
page folder, per this repo's placement rule (anything reused by 2+ places is `common/<category>/`; a chart is
reusable by definition).

## Import policy - tree-shaken only

Always import from `echarts/core` plus only the specific chart/component/renderer modules the chart uses,
registered once via `echarts.use([...])`:

```ts
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart /* only what you use */ } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent /* only what you use */ } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

Never `import * as echarts from "echarts"` (the full bundle) or `import "echarts"` for side effects - it pulls
in every chart type and inflates `wwwroot/dist/main.js`, which is committed to the repo. A pie chart needs
`PieChart` (not `BarChart`) from `echarts/charts` and usually `LegendComponent`; a line chart needs
`LineChart`; check what the specific chart type requires instead of copying `BarChart.vue`'s import list
verbatim.

## Lifecycle pattern (copy from `BarChart.vue`)

- `echarts.init()` on a template `ref` div, once, in `onMounted`.
- `chart.setOption(buildOption())` right after init, and again inside a `watch` over the component's data
  props (`{ deep: true }`) so the chart updates when the data changes - never call `echarts.init()` more than
  once for the same element; always `setOption` on data change, not re-init.
- Include `useTheme().theme` in that `watch` source, so a light/dark switch rebuilds the option with the
  re-read CSS tokens (canvas colors do not follow CSS on their own).
- A `ResizeObserver` on the container element calling `chart.resize()`, so the chart adapts to its `Card`/grid
  cell resizing (PrimeVue `Card`s here are inside a responsive Tailwind grid).
- `chart.dispose()` + `resizeObserver.disconnect()` in `onBeforeUnmount` - required, ECharts instances leak
  canvas/DOM listeners otherwise, and this SPA never fully reloads the page between route changes.

## Visual language - match the rest of the app, don't import an ECharts theme

- **Color:** read live CSS tokens at option-build time (`getComputedStyle(document.documentElement)
  .getPropertyValue(name).trim()`), never a hardcoded hex. Series colors come from the data palette in
  `src/style.css` (`--color-paint-gulf`, `--color-paint-green`, `--color-paint-bronze`, `--color-paint-burgundy`,
  `--color-paint-graphite`), which has lifted dark-theme variants; pass the token name via the `colorVar`
  prop as `Home.vue` does. Axes, grid, labels and tooltip use `--p-surface-*` / `--p-text-*` tokens. A hex
  appears only as the fallback argument when a token is missing (see `themeColor()` in `BarChart.vue`).
- **Axes/grid:** thin gray axis line, light gray split lines, small muted axis-label text - matches
  `BarChart.vue`'s `buildOption()`. Keep `grid` tight (`left/right: 8`, `top: 16`, `bottom: 24`,
  `containLabel: true`) so the chart sits flush inside its `Card`.
- **Tooltip:** always enable `tooltip: { trigger: "axis" }` (or `"item"` for a pie) with a `valueFormatter` -
  reuse `utils/format.ts` (`formatCurrency`/`formatDate`) inside it when the value is currency or a date,
  instead of raw numbers.
- **Never** import an ECharts theme JSON/file (`echarts.registerTheme(...)`) - the token-driven `buildOption()`
  approach is this app's theme.

## Props contract and wiring into a page

- Keep the chart component's props to plain data shapes (`labels`/`values`, or `{ name, value }[]`, or
  whatever the chart type needs) plus an optional `valueFormatter` - never a page-specific prop name, and
  never fetch data inside the chart component itself.
- The page component owns the data: derive the chart's props from data already loaded through the existing
  composables (`usePagedFetch`, `useEntityCrud`, `useCreateEntity`) via a `computed` that reshapes it - never
  add a new fetch path or duplicate aggregation logic that already exists on that page (e.g. `Home.vue`'s
  `activityBuckets` bucketing must stay the single source of truth for that data; a chart just maps its
  output).
- If the new chart lives on a page that doesn't have the data it needs yet, get the data through the standard
  composable pattern (extend `usePagedFetch`/add a new `options`-style API endpoint if needed) - that part is
  ordinary `primevue-component-build`/Frontend-Tooling-Specialist work, not something this skill invents.

## Verify

1. From `Src/CarStore.Web/ClientApp`: `npx vue-tsc --noEmit`, then `npm run build`; fix all errors.
2. Commit the regenerated `wwwroot/dist/` alongside the source change (same rule as every other ClientApp
   change in this repo).
3. Load the page (`dotnet run --project Src/CarStore.Web`, `http://localhost:5045`), confirm the chart renders
   with real data, resizes correctly, and that no console errors are thrown.
4. Record it via `/vault-write`: the chart component added/reused, the page it was wired into, and the data
   source/composable it consumes.

## Rules

- Every chart in the app goes through this skill and lives in `components/common/chart/` - never a one-off
  inline ECharts setup inside a page component.
- Never add a second charting library (Chart.js, ApexCharts, D3, ...) - ECharts is the app's only charting
  dependency; if ECharts genuinely cannot do what's needed, propose the alternative to the user instead of
  adding it unilaterally.
- Never hardcode a chart color as a raw hex - always a `--color-paint-*` or `--p-*` token, re-read on theme change.
- Never duplicate a data-shaping/aggregation computed that already exists on the target page - reuse it and
  only add the small mapping to the chart's prop contract.
- Never skip the `vue-tsc --noEmit` + `npm run build` verification step.
