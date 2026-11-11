<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DatePicker from "primevue/datepicker";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import FormField from "../form/FormField.vue";
import { dialogShellPt, dialogSecondaryButtonClass, dialogPrimaryButtonClass } from "./dialogStyles";
import type { BrandDto } from "../../../types";
import { Check } from "@lucide/vue";

export interface EditBrandPayload {
  name: string;
  country: string;
  foundedDate: string;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  brand: BrandDto | null;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: EditBrandPayload];
  cancel: [];
}>();

function formFromBrand(brand: BrandDto | null) {
  return {
    name: brand?.name ?? "",
    country: brand?.country ?? "",
    foundedDate: brand ? new Date(brand.foundedDate) : (null as Date | null),
    description: brand?.description ?? "",
  };
}

const form = reactive(formFromBrand(props.brand));
const validationError = ref<string | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, formFromBrand(props.brand));
      validationError.value = null;
    }
  },
);

function onUpdateVisible(value: boolean) {
  emit("update:visible", value);
  if (!value) emit("cancel");
}

function onSave() {
  if (!form.name.trim() || !form.foundedDate) {
    validationError.value = "Nome e data de fundação são obrigatórios.";
    return;
  }
  validationError.value = null;
  emit("submit", {
    name: form.name.trim(),
    country: form.country.trim(),
    foundedDate: form.foundedDate.toISOString(),
    description: form.description.trim(),
  });
}

const dialogPt = dialogShellPt("w-[480px]");
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
      <span class="text-[21px] font-bold text-color">Editar marca</span>
    </template>

    <FormField label="Nome">
      <InputText v-model="form.name" class="w-full" />
    </FormField>

    <FormField label="País">
      <InputText v-model="form.country" class="w-full" />
    </FormField>

    <FormField label="Data de fundação">
      <DatePicker v-model="form.foundedDate" date-format="dd/mm/yy" show-icon class="w-full" />
    </FormField>

    <div class="flex h-[138px] w-full flex-col gap-1.75">
      <label class="text-sm font-semibold text-color">Descrição</label>
      <Textarea v-model="form.description" class="h-[110px] w-full resize-none" />
    </div>

    <Message v-if="validationError || props.error" severity="error" :closable="false">
      {{ validationError ?? props.error }}
    </Message>

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
        label="Salvar"
        :loading="loading"
        :class="dialogPrimaryButtonClass"
        @click="onSave"
      >
        <template #icon><Check /></template>
      </Button>
    </template>
  </Dialog>
</template>
