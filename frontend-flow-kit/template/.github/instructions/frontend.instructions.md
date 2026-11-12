---
applyTo: "{{CLIENT_APP_DIR}}/**"
---

# Front-end instructions ({{PROJECT_NAME}}: Vue 3 + PrimeVue + Tailwind v4)

Single source of truth for humans and coding agents working inside `{{CLIENT_APP_DIR}}/`. Agents and skills
(`frontend-agent`, `qa-agent`, `figma-discovery`, `figma-refactor`, `primevue-component-build`, ...) point here
instead of repeating these rules, so **every project-specific fact lives in this file**.

> **Adapting this file:** every block marked `<!-- ADAPT -->` must be filled with this project's real
> values before the agents are used. Delete each marker once filled. Never leave a guess: if something does not
> exist yet (no composable, no shared table), write "none yet" so agents do not invent it.

## Stack

<!-- ADAPT: confirm versions from package.json; delete rows that do not apply. -->

| Concern | Choice | Notes |
|---|---|---|
| Framework | Vue 3 SFC, `<script setup lang="ts">` | SPA with `vue-router`. State manager: <!-- ADAPT: none / Pinia --> |
| Build | Vite + `@vitejs/plugin-vue` | Output: `{{BUILD_OUTPUT_DIR}}`. |
| UI kit | PrimeVue 4 + `@primeuix/themes` (preset: <!-- ADAPT: preset name and file -->) | Style PrimeVue through `pt`; query the `primevue` MCP for props/slots/`pt` sections. |
| Icons | `@lucide/vue` | `import { Plus } from "@lucide/vue"` → `<Plus />`. In PrimeVue use the `#icon` / `#itemicon` / `InputIcon` slot, never the string `icon` prop. Never `pi pi-*`, `bi-*` or raw SVG when a Lucide icon exists. |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) + `tailwindcss-primeui` | CSS-first: no `tailwind.config.js`; configuration lives in `src/style.css`. |
| Types | TypeScript strict, `vue-tsc` | |
| Charts | ECharts tree-shaken (`echarts/core`) | Only through `components/common/chart/` and `echarts-chart-build`. <!-- ADAPT: delete if the project has no charts --> |
| Typography | <!-- ADAPT: font + how it is loaded (self-hosted @fontsource, no CDN) --> | |

## Project facts

<!-- ADAPT: every row. Agents read these instead of guessing. -->

| Fact | Value |
|---|---|
| Live app URL (manual and Playwright MCP checks) | `{{APP_URL}}` |
| How the app is started locally | <!-- ADAPT: e.g. `npm run dev` + `dotnet run --project ...` --> |
| Routes / pages | <!-- ADAPT: `/`, `/orders`, ... → `<Feature>Page.vue` --> |
| API base path and contract | <!-- ADAPT: `/api/*`, paged response shape `{ items, totalCount }`, error shape `{ message }` --> |
| DTO types | <!-- ADAPT: e.g. `src/types.ts`, mirroring the backend DTOs --> |
| Backend build after a DTO change | `{{BACKEND_BUILD_CMD}}` |
| Built bundle committed? | <!-- ADAPT: yes (commit `{{BUILD_OUTPUT_DIR}}` with the change) / no --> |
| Exported Figma images | `{{IMAGES_DIR}}/<page>/`, referenced by absolute URL, not imported through Vite |
| UI copy language | <!-- ADAPT: pt-BR --> |
| Supported widths | <!-- ADAPT: desktop-only today / responsive (see `mobile-responsive`) --> |

## Folder layout

<!-- ADAPT: replace with the real tree. Keep the comments: they are what agents use to place files. -->

```
{{CLIENT_APP_DIR}}/
  vite.config.ts
  package.json               # dev | build | verify | check:conventions | visual:* (QA harness)
  playwright.config.ts       # visual harness only
  tsconfig.visual.json       # type-checks visual/ (npm run visual:type-check)
  scripts/check-conventions.mjs  # npm run check:conventions (part of npm run verify)
  visual/                    # QA visual harness, test-only, owned by qa-agent (see visual/README.md)
  src/
    main.ts                  # single entry: mounts the App once
    App.vue                  # shell: navigation + <RouterView />
    router/index.ts          # routes
    plugins/                 # PrimeVue preset, locale
    style.css                # Tailwind + primeui imports, theme variables, dark theme
    types.ts                 # DTO interfaces
    components/
      <Feature>Page.vue      # page composition
      common/<category>/     # anything reused by 2+ pages (chart, dialog, form, table, ...)
    composables/             # stateful logic: fetch, dialog state, loading/error, theme
    styles/                  # shared Tailwind class-string constants
    utils/                   # pure helpers (formatting, parsing)
```

Placement rules:

- Directly under `components/` only for a page (`<Feature>Page.vue`) or a page-specific child.
- Anything reused by 2+ pages goes to `components/common/<category>/`. Ask before inventing a new category.
- Stateful logic (fetch, dialog visibility, loading/error) belongs in `composables/`, never copy-pasted.
- Reusable Tailwind class strings go to `styles/`; shared `pt` objects next to the components that use them.
- Pure helpers go to `utils/`.

## Shared building blocks

<!-- ADAPT: list what exists. Agents MUST reuse these before creating anything. "none yet" is a valid answer. -->

| Piece | What it gives you |
|---|---|
| `components/common/table/<DataTable>.vue` | <!-- ADAPT: lazy paged table, columns contract, row actions, events --> |
| `components/common/dialog/*` + shared dialog `pt` | <!-- ADAPT --> |
| `components/common/form/*` | <!-- ADAPT --> |
| Page header | <!-- ADAPT --> |
| `styles/buttonStyles.ts` | <!-- ADAPT: primary/secondary/danger class constants --> |
| `utils/format.ts` | <!-- ADAPT: currency/date formatters (never inline `Intl` calls) --> |

## Data access

<!-- ADAPT: the composables and their contract. -->

| Composable | Use for | Contract |
|---|---|---|
| <!-- e.g. `usePagedFetch<T>(apiUrl)` --> | Every list/table | <!-- `GET {apiUrl}?page=&pageSize=` → paged result; exposes items, total, loading, error --> |

Rules (keep unless the project decides otherwise):

- **Server-side paging only.** Tables use `lazy` + `paginator`; never fetch everything and page client-side.
- Show API errors with PrimeVue `<Message severity="error">`, never `alert()`.
- Extend an existing composable before writing a new fetch/loading/error block.
- Keep the DTO types in sync with the backend. A missing endpoint or field is a backend dependency, reported in
  `lacunas`, never invented in the front end.
- Figma sample content is never an API contract, and fixtures never enter production code.

## Styling rules

1. **Design tokens, not hex.** Use the `tailwindcss-primeui` token utilities (`surface-*`, `text-color`,
   `text-muted-color`, `border-surface-*`, `bg-primary`, `text-primary-contrast`, ...). Never a raw hex or a
   fixed palette color (`bg-white`, `text-black`, `gray-*`, `slate-*`) when a token matches.
2. **Style PrimeVue through `pt` (passthrough) sections** (`root`, `header`, `content`, `footer`, ...), not a
   bare `class`. Check section names in the `primevue` MCP.
3. **`!important` is postfix in Tailwind v4** (`bg-surface-700!`). Add it only to override a PrimeVue
   theme-colored state class; PrimeVue injects its stylesheet after Tailwind, so equal-specificity utilities lose.
4. **Arbitrary values are fine** when the design is off Tailwind's scale (`rounded-[21px]`, `gap-1.75`,
   `w-[765px]`). Do not force a bad approximation to avoid one.
5. **Reuse shared class strings and `pt` helpers.** If a combination appears in 2+ places, extract it.
6. **No Bootstrap-style class names** (`.btn*`, `.form-*`, `.alert-*`) and no second UI framework.

### Light and dark themes (mandatory for every screen)

<!-- ADAPT: describe the mechanism: which class/attribute switches the theme (`.app-dark`, `.p-dark`,
`data-theme`), where it is set before first paint, `darkModeSelector` value, the composable that toggles it,
and any surface-mode switch. The visual harness reproduces this in `visual/app-setup.ts`. -->

Rules:

1. Tokens make the theme follow for free; a raw hex or fixed palette utility is a dark-theme bug.
2. Figma usually covers light only. Derive dark from the existing tokens, never invent per-screen dark colors.
3. Canvas consumers (ECharts) read CSS tokens at option-build time and rebuild on theme change.
4. Do not rely on a shadow alone to separate a panel in dark.
5. Contrast: body text ≥ 4.5:1, large text/icons ≥ 3:1, in both themes.

## Figma → code token mapping

Used by `figma-discovery` to translate Figma values. Extend it whenever a new value appears (and record the new
mapping through `vault-write`). Expected colors come from `get_variable_defs`, not from the hex fallbacks inside
`get_design_context` code.

<!-- ADAPT: fill with this project's design system. Generic rows below are a starting point. -->

| Figma variable / value | Use this token |
|---|---|
| Panel / card background | `bg-surface-0` |
| Primary body text | `text-color` |
| Muted / secondary text | `text-muted-color` |
| Light borders / dividers | `border-surface-200` / `border-surface-300` |
| Row hover / subtle fill | `surface-50` / `surface-100` |
| Brand / primary action fill | `bg-primary` + `text-primary-contrast` (or the shared primary button class) |
| Icon glyphs | Lucide components from `@lucide/vue` |
| <!-- ADAPT: e.g. `#334155` / `surface/700` --> | <!-- `surface-700` --> |

Component-level mappings already derived from Figma (reuse, do not re-derive):

<!-- ADAPT: e.g. "Modal shell (rounded 21px, 67px header) → `dialogShellPt(width)`". "none yet" is valid. -->

## Working from Figma

1. `figma-discovery` first (it reuses `.figma-cache/` before calling the Figma MCP). For UI that already exists,
   `figma-refactor` next. Then `primevue-component-build`.
2. Follow the Figma frame exactly. Any deviation (spacing, color, component swap, copy) is reported in `lacunas`
   and needs the user's approval; never mark it accepted on your own.
3. Exported images go to `{{IMAGES_DIR}}/<page>/`.

## Build loop and definition of done

- `npm run verify` (`vue-tsc --noEmit` + `check:conventions` + `vite build`) passes; fix every reported line.
- `{{BACKEND_BUILD_CMD}}` run if a DTO changed.
- Existing composable / class string / `pt` helper reused instead of duplicated.
- Page opened in the running app in **both light and dark themes**.
- Visual validation, when requested, runs through `qa-agent` (`frontend-visual-check`), not the implementer.
- Vault updated (`vault-write`), or the facts handed to the orchestrator.

## Never

- Never introduce a second UI framework (Bootstrap, Bulma) or JS framework (React, Angular).
- Never paginate client-side.
- Never hardcode colors that bypass the theme.
- Never edit generated output (`{{BUILD_OUTPUT_DIR}}`) by hand.
- Never change `vite.config.ts`, `package.json` dependencies, `tsconfig.json`, `.mcp.json` or
  `.vscode/mcp.json` from a component task: that is `frontend-tooling-specialist` scope.
<!-- ADAPT: add project-specific "never" rules, and mirror the mechanical ones in scripts/check-conventions.mjs. -->
