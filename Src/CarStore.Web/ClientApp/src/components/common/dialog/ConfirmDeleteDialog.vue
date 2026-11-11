<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Message from "primevue/message";
import { dialogShellPt, dialogSecondaryButtonClass, dialogDangerButtonClass } from "./dialogStyles";
import { TriangleAlert } from "@lucide/vue";

export interface ConfirmDeleteDetail {
  label: string;
  value: string;
}

const props = defineProps<{
  visible: boolean;
  title: string;
  message: string;
  details: ConfirmDeleteDetail[];
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

const dialogPt = dialogShellPt("w-[765px]");
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
      <span class="text-[21px] font-bold text-color">{{ props.title }}</span>
    </template>

    <div class="flex w-full items-center gap-3">
      <TriangleAlert class="text-base text-red-500" />
      <p class="flex-1 text-sm font-medium text-color">{{ props.message }}</p>
    </div>

    <div v-if="props.details.length" class="flex w-full flex-col gap-1.75">
      <div v-for="detail in props.details" :key="detail.label" class="flex w-full items-center gap-2 text-sm">
        <p class="shrink-0 font-semibold text-color">{{ detail.label }}:</p>
        <p class="min-w-0 flex-1 text-muted-color">{{ detail.value }}</p>
      </div>
    </div>

    <Message v-if="props.warning" severity="warn" :closable="false">{{ props.warning }}</Message>
    <Message v-if="props.error" severity="error" :closable="false">{{ props.error }}</Message>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        outlined
        :disabled="loading"
        :class="dialogSecondaryButtonClass"
        @click="onUpdateVisible(false)"
      />
      <Button
        label="Excluir"
        severity="danger"
        :loading="loading"
        :disabled="confirmDisabled"
        :class="dialogDangerButtonClass"
        @click="emit('confirm')"
      />
    </template>
  </Dialog>
</template>
