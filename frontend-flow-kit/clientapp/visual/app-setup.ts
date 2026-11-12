/**
 * Project adapter for the visual-check preview. THE ONLY browser-side file of
 * the harness that knows about this project. Adapt every `// ADAPT:` block so a
 * scenario renders exactly like production (same CSS, preset, locale, theme).
 *
 * Rule of thumb: mirror what `src/main.ts` and the HTML host page (index.html,
 * _Layout.cshtml, ...) do before the app mounts, minus the router and the app
 * shell (the engine provides a memory router; the shell is not mounted).
 *
 * The default below is a PrimeVue 4 + Aura + Tailwind v4 app whose dark theme is
 * a class on <html> (PrimeVue `darkModeSelector: '.app-dark'`). The CarStore
 * variant (inverted surface scale, `data-surface` palette modes) is shown in
 * the comments as a worked example.
 */
import type { App, VNodeChild } from 'vue'
import { h } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import Aura from '@primeuix/themes/aura'

import type { VisualScenario } from './types'

// ADAPT: the global stylesheets production loads (Tailwind entry, fonts, legacy site CSS).
import '../src/style.css'
// CarStore example: `_Layout.cshtml` also links wwwroot/css/site.css (root font-size):
//   import '../../wwwroot/css/site.css'

// ADAPT: the preset / locale production registers (import them from src/, never copy them).
// CarStore example:
//   import { CarStorePreset, DEFAULT_SURFACE_MODE } from '../src/plugins/primevue-preset'
//   import { primeVueLocalePtBr } from '../src/plugins/primevue-locale-pt-br'
const PRESET = Aura
const DARK_MODE_SELECTOR: string | false = '.app-dark'
const LOCALE: Record<string, unknown> | undefined = undefined

// ADAPT: the class / storage key the app's theme composable uses.
const DARK_CLASS = 'app-dark'
const THEME_STORAGE_KEY = 'app-theme'

/**
 * Put the document in the scenario's theme BEFORE the component module loads
 * (theme composables often read localStorage / <html> classes at import time).
 * Mirror the inline script of the host page.
 */
export function applyTheme(scenario: VisualScenario): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, scenario.theme)
  } catch {
    /* storage blocked: the class below still applies */
  }
  document.documentElement.classList.toggle(DARK_CLASS, scenario.theme === 'dark')

  // ADAPT: the host page paints the body; the captured element is often transparent,
  // so paint the same token behind it (Tailwind + tailwindcss-primeui utility).
  document.body.classList.add('bg-surface-0')

  // CarStore example (surface palette modes persisted next to the theme):
  //   const surface = scenario.localStorageSeed?.['carstore-surface'] ?? DEFAULT_SURFACE_MODE
  //   localStorage.setItem('carstore-surface', surface)
  //   document.documentElement.setAttribute('data-surface', surface)
}

/** Register the plugins/services production registers (except the router: the engine adds a memory router). */
export async function installApp(app: App, _scenario: VisualScenario): Promise<void> {
  // ADAPT: PrimeVue options as in src/main.ts.
  // CarStore example: { theme: { preset: CarStorePreset, options: { darkModeSelector: false } }, locale: primeVueLocalePtBr }
  app.use(PrimeVue, {
    theme: { preset: PRESET, options: { darkModeSelector: DARK_MODE_SELECTOR } },
    ...(LOCALE ? { locale: LOCALE } : {}),
  })
  app.use(ToastService)
  // ADAPT: other global plugins (i18n, ConfirmationService, Tooltip directive, Pinia...).
}

/**
 * What the root renders around the component. Keep the global elements the
 * app shell hosts (e.g. `<Toast />`) so toasts render as in production.
 */
export function renderRoot(component: VNodeChild, _scenario: VisualScenario): VNodeChild {
  // ADAPT: match the app shell's global elements and their props.
  return [h(Toast, { position: 'bottom-right' }), component]
}
