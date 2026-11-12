# package.json additions for the frontend flow

Merge into the client app's `package.json` (the folder that holds `vite.config.ts` and `src/`).
`dev` must run Vite: the harness starts `npm run dev -- --config visual/vite.config.ts`.

## Scripts

```json
"check:conventions": "node scripts/check-conventions.mjs",
"verify": "vue-tsc --noEmit && node scripts/check-conventions.mjs && vite build",
"visual:check": "playwright test visual/capture.spec.ts",
"visual:check:scenario": "node visual/run-scenario.mjs",
"visual:compare": "node visual/run-compare.mjs",
"visual:recheck": "node visual/run-recheck.mjs",
"visual:verdict": "node visual/write-verdict.mjs",
"visual:measure": "node visual/run-measure.mjs",
"visual:crop": "node visual/tools/crop.mjs",
"visual:attempt-diff": "node visual/tools/attempt-diff.mjs",
"visual:ids": "node visual/tools/ids.mjs",
"visual:prune": "node visual/tools/prune.mjs",
"visual:list": "playwright test visual/capture.spec.ts --list",
"visual:type-check": "vue-tsc --noEmit -p tsconfig.visual.json",
"visual:test": "node --test visual/lib/findings.test.mjs"
```

## Dependencies the flow assumes (versions verified on CarStore)

```bash
npm i vue@^3.5 vue-router@^5 primevue@^4.3 @primeuix/themes@^1 @lucide/vue@^1.71
npm i -D vite@^8 @vitejs/plugin-vue@^6 tailwindcss@^4.3 @tailwindcss/vite@^4.3 tailwindcss-primeui@^0.6 \
  typescript@^6 vue-tsc@^3.3 @types/node@^24
```

Optional: `echarts@^6` (charts, tree-shaken through `echarts/core`), `@fontsource/inter@^5` (self-hosted font).

## Visual harness (QA) dev dependencies

```bash
npm i -D @playwright/test@^1.65 pixelmatch@^7.2 pngjs@^7 @types/pngjs@^6.0.5
npx playwright install chromium
```

Node 20+ (verified on Node 24). The harness uses `import ... with { type: 'json' }` and `node --test`.

## Other wiring

- Global stylesheet: `@source not "../visual";` so harness classes never reach the production CSS.
- `.gitignore` (repository root): `.figma-cache/`, `.visual-baseline/`, `.playwright-mcp/`,
  `qa-results/.current-run`, `qa-results/index.html`, `qa-results/*/**/*.png`, `qa-results/*/data/`,
  `qa-results/*/comparison/`, `qa-results/*/verdict-draft.json`.
- `tsconfig.visual.json` extends `./tsconfig.json`: the app tsconfig must not exclude `visual/` from
  module resolution of `src/` (only its own `include` matters).
