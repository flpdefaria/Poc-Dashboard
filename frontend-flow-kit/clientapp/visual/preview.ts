/**
 * Test-only preview entry for the visual-check harness (generic engine).
 *
 * Mounts ONE real component in isolation. Everything project-specific (global
 * stylesheets, PrimeVue preset/locale, services, theme switching, root
 * wrappers such as a global <Toast />) lives in `visual/app-setup.ts`, which
 * each project adapts. This file deliberately does not import `src/main.ts`,
 * the app shell or the production router, so a scenario renders without the
 * backend and every API call is answered by the scenario's mocks.
 */
import { createApp, defineComponent, h, nextTick, type Component } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

import { applyTheme, installApp, renderRoot } from './app-setup'
import { getScenario, scenarioIds } from './scenarios'
import type { VisualScenario } from './types'

const MOUNT_SELECTOR = '#preview-root'

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

/** Engine-owned chrome: language, theme marker and mount width. Theme itself is `applyTheme`. */
function applyChrome(scenario: VisualScenario): void {
  applyTheme(scenario)
  document.documentElement.setAttribute('lang', scenario.locale)
  document.body.dataset.previewTheme = scenario.theme
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
      // Named links (`:to="{ name: 'orders' }"`) need a resolvable route name.
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

  // Seed BEFORE the component module loads: theme composables often read
  // localStorage at import time.
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
    setup: () => () => renderRoot(h(component, { ...props }), scenario),
  })

  const app = createApp(root)
  const router = buildRouter(scenario)
  app.use(router)
  await installApp(app, scenario)

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
