/**
 * Test-only preview entry for the visual-check harness.
 *
 * Mounts ONE real component in isolation with the same plugins, preset, locale
 * and global stylesheets the production app uses (`src/main.ts` +
 * `_Layout.cshtml`). It deliberately does not import `src/main.ts`, `App.vue`
 * or the production router, so a scenario renders without the ASP.NET host and
 * every `/api/*` call is answered by the scenario's mocks.
 */
import '../src/style.css'
// `_Layout.cshtml` also links wwwroot/css/site.css (root font-size 14px / 16px ≥ 768px).
import '../../wwwroot/css/site.css'

import { createApp, defineComponent, h, nextTick, type Component } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import { createRouter, createMemoryHistory } from 'vue-router'

import { CarStorePreset } from '../src/plugins/primevue-preset'
import { primeVueLocalePtBr } from '../src/plugins/primevue-locale-pt-br'
import { DEFAULT_SURFACE_MODE } from '../src/plugins/primevue-preset'
import { getScenario, scenarioIds } from './scenarios'
import type { VisualScenario } from './types'

const MOUNT_SELECTOR = '#preview-root'
/** `useTheme.ts` keys. */
const THEME_KEY = 'carstore-theme'
const SURFACE_KEY = 'carstore-surface'

function renderError(message: string): void {
  const host = document.querySelector(MOUNT_SELECTOR) ?? document.body
  const box = document.createElement('pre')
  box.className = 'preview-error'
  box.setAttribute('data-preview-error', 'true')
  box.textContent = message
  host.appendChild(box)
  document.body.dataset.previewError = 'true'
  document.body.dataset.previewReady = 'true'
}

/**
 * Mirror the inline script in `_Layout.cshtml`: `app-dark` on <html> for the
 * dark theme and `data-surface` for the surface mode, both persisted in
 * localStorage so `useTheme()` (evaluated when the component imports it)
 * reads the same values instead of resetting them.
 */
function applyChrome(scenario: VisualScenario): void {
  // The app's own default (the baseline worktree resolves its own value), unless the scenario seeds one.
  const surface = scenario.localStorageSeed?.[SURFACE_KEY] ?? DEFAULT_SURFACE_MODE
  try {
    localStorage.setItem(THEME_KEY, scenario.theme)
    localStorage.setItem(SURFACE_KEY, surface)
  } catch {
    /* storage blocked: the class/attribute below still apply */
  }
  const html = document.documentElement
  html.classList.toggle('app-dark', scenario.theme === 'dark')
  html.setAttribute('data-surface', surface)
  html.setAttribute('lang', scenario.locale)
  document.body.dataset.previewTheme = scenario.theme
  // `_Layout.cshtml` paints the page with `bg-surface-0`; the captured element
  // is often transparent, so paint the same token behind it.
  document.body.classList.add('bg-surface-0')
  if (scenario.mountWidth) {
    Object.assign(document.querySelector<HTMLElement>(MOUNT_SELECTOR)!.style, {
      display: 'block',
      padding: '0',
      width: `${scenario.mountWidth}px`,
    })
  }
}

function buildRouter(scenario: VisualScenario) {
  const blank = defineComponent({ render: () => null })
  return createRouter({
    history: createMemoryHistory(),
    // No lazy route modules: the preview only needs `useRoute()`/`useRouter()`
    // and `RouterLink` to resolve, never real navigation.
    routes: [
      {
        path: scenario.route?.params
          ? Object.entries(scenario.route.params).reduce(
              (p, [key, value]) => p.replace(`/${value}`, `/:${key}`),
              scenario.route.path,
            )
          : '/:pathMatch(.*)*',
        name: 'preview-catch-all',
        component: blank,
        meta: scenario.route?.meta ?? {},
      },
      // Named links (`:to="{ name: 'cars' }"`) need a resolvable route name.
      ...(scenario.routeNames ?? []).map((name) => ({
        path: `/__preview-route/${name}/:pathMatch(.*)*`,
        name,
        component: blank,
      })),
    ],
  })
}

async function resolveComponent(scenario: VisualScenario): Promise<Component> {
  const loaded = await scenario.component()
  const component = (loaded as { default?: Component }).default ?? (loaded as Component)
  if (!component) {
    throw new Error(`Scenario "${scenario.id}" loader resolved to no component.`)
  }
  return component
}

async function signalReady(): Promise<void> {
  await nextTick()
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  // Two frames so PrimeVue's post-mount style injection and any layout
  // settle before the screenshot is taken.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  document.body.dataset.previewReady = 'true'
}

async function bootstrap(): Promise<void> {
  const scenarioId = new URLSearchParams(window.location.search).get('scenario')

  if (!scenarioId) {
    renderError('No ?scenario=<id> query parameter supplied.\n\nKnown scenarios:\n  ' + scenarioIds().join('\n  '))
    return
  }

  const scenario = getScenario(scenarioId)
  if (!scenario) {
    renderError(`Unknown scenario id "${scenarioId}".\n\nKnown scenarios:\n  ` + scenarioIds().join('\n  '))
    return
  }

  // Seed BEFORE the component module loads: `useTheme.ts` reads localStorage
  // at import time.
  for (const [key, value] of Object.entries(scenario.localStorageSeed ?? {})) {
    localStorage.setItem(key, value)
  }
  applyChrome(scenario)

  let component: Component
  try {
    component = await resolveComponent(scenario)
  } catch (error) {
    renderError(`Failed to load component for scenario "${scenario.id}":\n${String(error)}`)
    return
  }

  const props = scenario.props ?? {}
  const root = defineComponent({
    name: 'VisualPreviewRoot',
    // `App.vue` hosts the global <Toast position="bottom-right" />; keep it so
    // create/edit/delete toasts render as in production.
    setup: () => () => [h(Toast, { position: 'bottom-right' }), h(component, { ...props })],
  })

  const app = createApp(root)
  const router = buildRouter(scenario)
  app.use(router)
  app.use(PrimeVue, {
    theme: { preset: CarStorePreset, options: { darkModeSelector: false } },
    locale: primeVueLocalePtBr,
  })
  app.use(ToastService)

  const target = scenario.route?.path ?? '/'
  await router.replace({ path: target, query: scenario.route?.query })
  await router.isReady()

  app.config.errorHandler = (error) => {
    // Surface render errors visibly instead of leaving a blank screenshot.
    renderError(`Render error in scenario "${scenario.id}":\n${String(error)}`)
  }

  app.mount(MOUNT_SELECTOR)
  await signalReady()
}

bootstrap().catch((error) => renderError(`Preview bootstrap failed:\n${String(error)}`))
