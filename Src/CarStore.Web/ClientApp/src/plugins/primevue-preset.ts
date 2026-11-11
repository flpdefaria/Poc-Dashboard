import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * Surface modes, taken from the Atlas app (Prometheus design system, `Surface` collection): each one
 * maps `surface.50…950` onto the Aura primitive palette with the same name.
 *
 * The active mode lives in CSS, not in the preset: `<html data-surface="…">` selects which primitive
 * palette feeds the `--sm-*` variables in `style.css`, and the preset's surface scale reads those
 * variables. A plain attribute switch recolors everything, the inline script in `_Layout.cshtml` can
 * apply the saved mode before first paint, and the inverted dark ramp (`html.app-dark`) follows the
 * same mode.
 */
export const SURFACE_MODES = ["gray", "neutral", "slate", "stone", "zinc"] as const;
export type SurfaceMode = (typeof SURFACE_MODES)[number];
/** Gray = the surface mode the Figma frames resolve to (`get_variable_defs`: text #1f2937, borders #e5e7eb). */
export const DEFAULT_SURFACE_MODE: SurfaceMode = "gray";

export function isSurfaceMode(value: unknown): value is SurfaceMode {
  return typeof value === "string" && (SURFACE_MODES as readonly string[]).includes(value);
}

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const surfacePalette: Record<string, string> = {
  0: "var(--sm-0)",
  ...Object.fromEntries(SHADES.map((shade) => [shade, `var(--sm-${shade})`])),
};

/** `primary.N` aliases `surface.N` (the Atlas "Noir" monochrome primary), so it follows the surface mode too. */
const primaryPalette: Record<string, string> = Object.fromEntries(
  SHADES.map((shade) => [shade, `{surface.${shade}}`]),
);

/**
 * CarStore's Aura customization, modeled on Atlas' `AtlasPreset`.
 *
 * Only the light color scheme is declared: PrimeVue's dark mode stays off (`darkModeSelector: false`)
 * and the dark theme inverts the surface scale under `html.app-dark` instead. Every value below is a
 * surface alias, so in dark `primary.950` becomes the light end of the ramp and `surface.0` the dark
 * canvas: the primary action turns into a light fill with dark text with no per-scheme tokens.
 *
 * `extend` adds the Prometheus tokens PrimeVue has no slot for: `--p-soft-*`, `--p-layout-*` and
 * `--p-highlight-pressed-background`.
 */
export const CarStorePreset = definePreset(Aura, {
  semantic: {
    primary: primaryPalette,
    colorScheme: {
      light: {
        surface: surfacePalette,
        // Figma `text/color` resolves to surface 800 (#1f2937 in gray); Aura defaults to 700. Muted stays 500 (#6b7280).
        text: {
          color: "{surface.800}",
          hoverColor: "{surface.900}",
          mutedColor: "{surface.500}",
          hoverMutedColor: "{surface.600}",
        },
        primary: {
          color: "{primary.950}",
          contrastColor: "{surface.0}",
          hoverColor: "{primary.800}",
          activeColor: "{primary.700}",
        },
        highlight: {
          background: "{primary.950}",
          focusBackground: "{primary.700}",
          color: "{surface.0}",
          focusColor: "{surface.0}",
        },
      },
    },
  },
  components: {
    // Figma tag/info = cyan 100 fill with cyan 700 ink (#cffafe / #0e7490); Aura's default is sky.
    // Figma togglebutton (Prometheus, resolved): track = sunken surface (#f9fafb), idle label 600, checked
    // label 950, 10px / 4.5px content padding. Aura uses surface 100 / 500 / 900 and 12px / 4px. The track
    // uses the `--color-sunken` token (style.css): surface 50 in light, one step above the card in dark,
    // where surface 50 IS the card background and the track would vanish.
    togglebutton: {
      content: { padding: "0.28125rem 0.625rem" },
      colorScheme: {
        light: {
          root: {
            background: "var(--color-sunken)",
            checkedBackground: "var(--color-sunken)",
            hoverBackground: "var(--color-sunken)",
            borderColor: "var(--color-sunken)",
            checkedBorderColor: "var(--color-sunken)",
            color: "{surface.600}",
            hoverColor: "{surface.800}",
            checkedColor: "{surface.950}",
          },
          icon: { color: "{surface.600}", hoverColor: "{surface.800}", checkedColor: "{surface.950}" },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {
          info: { background: "{cyan.100}", color: "{cyan.700}" },
        },
      },
    },
  },
  extend: {
    highlight: {
      pressedBackground: "{primary.600}",
    },
    soft: {
      background: "{primary.200}",
      color: "{primary.900}",
      hoverBackground: "{primary.300}",
      hoverColor: "{primary.950}",
      pressedBackground: "{primary.400}",
    },
    layout: {
      container: "{surface.0}",
      panel: "{surface.50}",
      subtle: "{surface.50}",
      divider: "{surface.200}",
    },
  },
});
