---
name: echarts-chart-build
description: "Use when: adding a chart to ANY {{PROJECT_NAME}} page or dialog, adding a new chart type (line, pie, multi-series bar, ...) not yet covered by a components/common/chart/ component, or restyling/extending one. Every chart goes through this skill so they all share one import strategy and one token-driven visual language."
argument-hint: "The page/component the chart goes in, the data it charts, and the chart type"
---

# ECharts chart build

Builds or extends a chart component in `{{CLIENT_APP_DIR}}/src/components/common/chart/`. ECharts is the only
charting library. Handbook: https://echarts.apache.org/handbook/en/get-started/

## Reuse before creating

1. Check `components/common/chart/` first. If a component matches the chart type AND the prop shape, reuse it.
2. Add a new component only when the chart type or data shape genuinely differs.
3. Name it `<Type>Chart.vue` (`LineChart.vue`, `PieChart.vue`, `StackedBarChart.vue`), generic by type, never by
   the page that first needed it.

## Import policy: tree-shaken only

```ts
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";                       // only what you use
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

Never `import * as echarts from "echarts"` (full bundle).

## Lifecycle

- `echarts.init()` once on a template `ref`, in `onMounted`; then `chart.setOption(buildOption())`.
- `watch` the data props (`deep: true`) **and the theme state** (the composable named in
  `frontend.instructions.md` → themes) and call `setOption(buildOption())`. Never re-init.
- A `ResizeObserver` on the container calling `chart.resize()`.
- `chart.dispose()` + `resizeObserver.disconnect()` in `onBeforeUnmount`.

## Visual language

- **Color:** read CSS tokens at option-build time
  (`getComputedStyle(document.documentElement).getPropertyValue(name).trim()`), never a hardcoded hex; a hex only
  as the fallback when a token is missing. Series colors come from the project's data palette tokens; axes, grid,
  labels and tooltip from `--p-surface-*` / `--p-text-*`. A canvas cannot parse `color-mix()` values: read plain
  token steps.
- **Font:** ECharts draws on canvas and does not inherit the page font; name the family explicitly.
- **Figma:** with a chart node, take axis/grid/label/bar values from `figma-discovery`.
- **Tooltip:** always on, with a `valueFormatter` that reuses the project's formatters.
<!-- ADAPT: once the first chart exists, name it here as the reference implementation and list the palette tokens. -->

## Props and data

- Props are plain data shapes (`labels`/`values`, `{ name, value }[]`, ...) plus an optional formatter. The chart
  never fetches.
- The page owns the data through the existing composables; reuse existing aggregation, only map it.

## Verify

1. `npm run verify` in `{{CLIENT_APP_DIR}}`.
2. Open the page (`{{APP_URL}}`): real data renders, resizes, no console errors, both themes.
3. Report (or `vault-write`) the chart component, the page and the data source.

## Rules

- Every chart lives in `components/common/chart/`; never a one-off inline ECharts setup in a page.
- Never add a second charting library; propose it to the user instead.
- Never hardcode a chart color.
