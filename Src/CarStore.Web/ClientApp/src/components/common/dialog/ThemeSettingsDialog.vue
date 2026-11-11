<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { Check } from "@lucide/vue";
import { dialogShellPt, dialogSecondaryButtonClass } from "./dialogStyles";
import { SURFACE_MODES, useTheme, type SurfaceMode } from "../../../composables/useTheme";

/**
 * Appearance settings (surface mode), modeled on Atlas' ThemeSettingsDialog. Light/dark is switched
 * only by the sidebar's theme icon button. Every choice applies immediately and is persisted by
 * useTheme(); there is no save step, so the footer only closes the dialog.
 */
defineProps<{ visible: boolean }>();
const emit = defineEmits<{ "update:visible": [value: boolean] }>();

const { surface, setSurface } = useTheme();

const SURFACE_LABELS: Record<SurfaceMode, string> = {
  gray: "Cinza",
  neutral: "Neutro",
  slate: "Ardósia",
  stone: "Pedra",
  zinc: "Zinco",
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
      <span class="text-[21px] font-bold text-color">Aparência</span>
    </template>

    <fieldset class="m-0 min-w-0 border-0 p-0">
      <legend class="mb-1 p-0 text-sm font-semibold text-color">Superfície</legend>
      <p class="mb-3 text-xs text-muted-color">Paleta neutra usada em fundos, bordas, textos e na ação principal.</p>
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
      <Button label="Fechar" severity="secondary" outlined :class="dialogSecondaryButtonClass" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
</template>
