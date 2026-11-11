import { ref } from "vue";
import {
  DEFAULT_SURFACE_MODE,
  SURFACE_MODES,
  isSurfaceMode,
  type SurfaceMode,
} from "../plugins/primevue-preset";

export type Theme = "light" | "dark";
export type { SurfaceMode };
export { SURFACE_MODES };

const STORAGE_KEY = "carstore-theme";
const SURFACE_STORAGE_KEY = "carstore-surface";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Storage blocked: fall back to the defaults.
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the choice simply won't persist.
  }
}

function initialTheme(): Theme {
  const saved = readStorage(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialSurface(): SurfaceMode {
  const saved = readStorage(SURFACE_STORAGE_KEY);
  return isSurfaceMode(saved) ? saved : DEFAULT_SURFACE_MODE;
}

// The inline script in _Layout.cshtml applies the same rules before first paint (no theme flash);
// this re-applies them in case the page shell was served without that script.
const theme = ref<Theme>(initialTheme());
const surface = ref<SurfaceMode>(initialSurface());
document.documentElement.classList.toggle("app-dark", theme.value === "dark");
document.documentElement.setAttribute("data-surface", surface.value);

function apply(next: Theme) {
  document.documentElement.classList.toggle("app-dark", next === "dark");
  theme.value = next;
  writeStorage(STORAGE_KEY, next);
}

/**
 * Switches to `next` with a circular reveal grown from the control that triggered it (View
 * Transitions), falling back to an instant swap where unsupported or when reduced motion is requested.
 */
function setTheme(next: Theme, event?: Event) {
  if (next === theme.value) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduceMotion) {
    apply(next);
    return;
  }

  const target = event?.currentTarget as HTMLElement | undefined;
  const rect = target?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => apply(next));
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

function toggle(event?: MouseEvent) {
  setTheme(theme.value === "dark" ? "light" : "dark", event);
}

/**
 * Switches the surface mode (Atlas / Prometheus palette). `primary` aliases `surface` in the preset,
 * so this recolors both scales; the change is a CSS attribute swap, so it applies instantly.
 */
function setSurface(next: SurfaceMode) {
  const mode = isSurfaceMode(next) ? next : DEFAULT_SURFACE_MODE;
  document.documentElement.setAttribute("data-surface", mode);
  surface.value = mode;
  writeStorage(SURFACE_STORAGE_KEY, mode);
}

export function useTheme() {
  return { theme, surface, toggle, setTheme, setSurface };
}
