<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Message from "primevue/message";
import {
  dialogShellPt,
  dialogSecondaryButtonClass,
  dialogDangerButtonClass,
  modalDialogPt,
  modalDialogTitleClass,
} from "./dialogStyles";
import { dangerButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import { Trash2, TriangleAlert, X } from "@lucide/vue";

export interface ConfirmDeleteDetail {
  label: string;
  value: string;
}

/** One record in the Figma "selected-list" (Cars delete-dialog 2072:2752). */
export interface ConfirmDeleteItem {
  key: string | number;
  title: string;
  subtitle?: string;
  /** Trailing muted value, e.g. a price. */
  meta?: string;
}

const props = defineProps<{
  visible: boolean;
  title: string;
  message: string;
  details?: ConfirmDeleteDetail[];
  /**
   * Opt-in Figma layout (Cars delete-dialog 2072:2729): 400px dialog, "cannot be undone" error banner,
   * `message` as the intro line and these records in a scrollable bordered list. Without it the legacy
   * label/value layout is used (Brands, Customers).
   */
  items?: ConfirmDeleteItem[];
  /** Label of the destructive action (Figma layout); defaults to "Excluir". */
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  /** Blocks the Delete action for a known rule (e.g. a brand with cars), shown as a warning instead of the danger message. */
  confirmDisabled?: boolean;
  warning?: string | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean]; confirm: []; cancel: [] }>();

function onUpdateVisible(value: boolean) {
  emit("update:visible", value);
  if (!value) emit("cancel");
}

const listMode = computed(() => props.items !== undefined);
const dialogPt = computed(() => (listMode.value ? modalDialogPt("w-[400px]") : dialogShellPt("w-[765px]")));

// Figma "message" error (Cars delete-dialog 2072:2739): 33px = 1px #fecaca border + 6px x 10px padding + 19px line
// (16px / 500 text), 8px gap, 16px icon, #b91c1c ink. Aura draws the border as an outline in the same red 200, so a
// real border replaces it (`outline-0!`) and keeps the 33px box. Light colors use the PrimeVue palette vars
// (red 200 / red 700); under `html.app-dark` the ink falls back to the dark message tokens from style.css.
// `!` beats PrimeVue's unlayered `.p-message` / `.p-message-content` rules.
const bannerPt = {
  root: {
    class:
      "rounded-md! border border-(--p-message-error-border-color) outline-0! text-(--p-red-700)! [html.app-dark_&]:text-(--p-message-error-color)!",
  },
  content: { class: "gap-2! px-2.5! py-1.5!" },
  text: { class: "text-base! leading-[19px]! font-medium!" },
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="onUpdateVisible"
    modal
    dismissable-mask
    :closable="!loading"
    :close-on-escape="!loading"
    :draggable="false"
    :pt="dialogPt"
  >
    <template #header>
      <span v-if="listMode" :class="modalDialogTitleClass">{{ props.title }}</span>
      <span v-else class="text-[21px] font-bold text-color">{{ props.title }}</span>
    </template>
    <template v-if="listMode" #closeicon><X /></template>

    <template v-if="listMode">
      <Message severity="error" :closable="false" :pt="bannerPt">
        <template #icon><TriangleAlert class="size-4 shrink-0" /></template>
        Esta ação não pode ser desfeita.
      </Message>

      <p class="text-sm text-color">{{ props.message }}</p>

      <!-- Figma selected-list: 1px surface-200 border, 6px radius, 256px tall at most (scrolls), 16/8px rows. -->
      <ul v-if="props.items?.length" class="max-h-64 overflow-y-auto rounded-md border border-surface-200">
        <li
          v-for="item in props.items"
          :key="item.key"
          class="flex items-center gap-4 border-b border-surface-200 px-4 py-2 last:border-b-0"
        >
          <div class="flex min-w-0 flex-1 flex-col">
            <p class="truncate text-sm font-semibold text-color">{{ item.title }}</p>
            <p v-if="item.subtitle" class="truncate text-xs leading-4 text-muted-color">{{ item.subtitle }}</p>
          </div>
          <p v-if="item.meta" class="shrink-0 text-sm text-muted-color">{{ item.meta }}</p>
        </li>
      </ul>
    </template>

    <template v-else>
      <div class="flex w-full items-center gap-3">
        <TriangleAlert class="text-base text-red-500" />
        <p class="flex-1 text-sm font-medium text-color">{{ props.message }}</p>
      </div>

      <div v-if="props.details?.length" class="flex w-full flex-col gap-1.75">
        <div v-for="detail in props.details" :key="detail.label" class="flex w-full items-center gap-2 text-sm">
          <p class="shrink-0 font-semibold text-color">{{ detail.label }}:</p>
          <p class="min-w-0 flex-1 text-muted-color">{{ detail.value }}</p>
        </div>
      </div>
    </template>

    <Message v-if="props.warning" severity="warn" :closable="false">{{ props.warning }}</Message>
    <Message v-if="props.error" severity="error" :closable="false">{{ props.error }}</Message>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        outlined
        :disabled="loading"
        :class="listMode ? secondaryButtonMdClass : dialogSecondaryButtonClass"
        @click="onUpdateVisible(false)"
      />
      <Button
        :label="listMode ? (props.confirmLabel ?? 'Excluir') : 'Excluir'"
        severity="danger"
        :loading="loading"
        :disabled="confirmDisabled"
        :class="listMode ? dangerButtonMdClass : dialogDangerButtonClass"
        @click="emit('confirm')"
      >
        <template v-if="listMode" #icon><Trash2 /></template>
      </Button>
    </template>
  </Dialog>
</template>
