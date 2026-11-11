<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { Check, Moon, Sun } from "@lucide/vue";
import { dialogShellPt, dialogSecondaryButtonClass } from "./dialogStyles";
import { SURFACE_MODES, useTheme, type SurfaceMode, type Theme } from "../../../composables/useTheme";

/**
 * Theme settings (light/dark + surface mode), modeled on Atlas' ThemeSettingsDialog. Every choice
 * applies immediately and is persisted by useTheme(); there is no save step, so the footer only
 * closes the dialog.
 */
defineProps<{ visible: boolean }>();
const emit = defineEmits<{ "update:visible": [value: boolean] }>();

const { theme, surface, setTheme, setSurface } = useTheme();

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const SURFACE_LABELS: Record<SurfaceMode, string> = {
  gray: "Gray",
  neutral: "Neutral",
  slate: "Slate",
  stone: "Stone",
  zinc: "Zinc",
};

// Shades in each swatch strip, light to dark. Primitive variables (`--p-gray-50`, ...) are static,
// so every strip shows its own palette whatever mode or theme is active.
const SWATCH_SHADES = [50, 200, 400, 600, 800, 950] as const;

const optionClass = (selected: boolean) =>
  [
    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-color transition-colors",
    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
    selected ? "border-primary bg-surface-50" : "border-surface-300 hover:bg-surface-50",
  ].join(" ");

const dialogPt = dialogShellPt("w-[520px]");
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(value: boolean) => emit('update:visible', value)"
    modal
    dismissable-mask
    :draggable="false"
    :pt="dialogPt"
  >
    <template #header>
      <span class="text-[21px] font-bold text-color">Appearance</span>
    </template>

    <fieldset class="m-0 min-w-0 border-0 p-0">
      <legend class="mb-3 p-0 text-sm font-semibold text-color">Theme</legend>
      <div class="grid grid-cols-2 gap-3">
        <label v-for="option in THEME_OPTIONS" :key="option.value" :class="optionClass(theme === option.value)">
          <input
            type="radio"
            name="theme-mode"
            class="sr-only"
            :value="option.value"
            :checked="theme === option.value"
            @change="(event) => setTheme(option.value, event)"
          />
          <component :is="option.icon" class="text-base" />
          <span class="flex-1">{{ option.label }}</span>
          <Check v-if="theme === option.value" class="text-base" aria-hidden="true" />
        </label>
      </div>
    </fieldset>

    <fieldset class="m-0 min-w-0 border-0 p-0">
      <legend class="mb-1 p-0 text-sm font-semibold text-color">Surface</legend>
      <p class="mb-3 text-xs text-muted-color">Neutral palette behind backgrounds, borders, text and the primary action.</p>
      <div class="flex flex-col gap-2">
        <label v-for="mode in SURFACE_MODES" :key="mode" :class="optionClass(surface === mode)">
          <input
            type="radio"
            name="surface-mode"
            class="sr-only"
            :value="mode"
            :checked="surface === mode"
            @change="setSurface(mode)"
          />
          <span class="w-20 shrink-0">{{ SURFACE_LABELS[mode] }}</span>
          <span class="flex h-5 flex-1 overflow-hidden rounded-md border border-surface-300" aria-hidden="true">
            <span
              v-for="shade in SWATCH_SHADES"
              :key="shade"
              class="flex-1"
              :style="{ backgroundColor: `var(--p-${mode}-${shade})` }"
            />
          </span>
          <Check v-if="surface === mode" class="text-base" aria-hidden="true" />
          <span v-else class="size-4 shrink-0" aria-hidden="true" />
        </label>
      </div>
    </fieldset>

    <template #footer>
      <Button label="Close" severity="secondary" outlined :class="dialogSecondaryButtonClass" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
</template>
