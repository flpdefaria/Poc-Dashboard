<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DatePicker from "primevue/datepicker";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import FormField from "../form/FormField.vue";
import {
  modalDialogPt,
  modalDialogTitleClass,
  modalInputClass,
  modalDatePickerPt,
  modalFieldIconProps,
  modalTextareaClass,
} from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import type { BrandDto } from "../../../types";
import { Calendar, X } from "@lucide/vue";

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

// Figma form-dialog "Editar marca" (2113:3486): 400px.
const dialogPt = modalDialogPt("w-[400px]");
const idPrefix = "edit-brand";
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
      <!-- Initial focus: without an [autofocus] element PrimeVue Dialog focuses the close button with a visible ring,
           which Figma does not draw. The title takes it instead (tabindex -1: not in the Tab order, no outline). -->
      <span :class="modalDialogTitleClass" class="outline-none" autofocus tabindex="-1">Editar marca</span>
    </template>
    <template #closeicon><X /></template>

    <FormField label="Nome" :input-id="`${idPrefix}-name`" compact>
      <InputText :id="`${idPrefix}-name`" v-model="form.name" class="w-full" :class="modalInputClass" />
    </FormField>

    <FormField label="País" :input-id="`${idPrefix}-country`" compact>
      <InputText :id="`${idPrefix}-country`" v-model="form.country" class="w-full" :class="modalInputClass" />
    </FormField>

    <FormField label="Data de fundação" :input-id="`${idPrefix}-founded`" compact>
      <DatePicker
        v-model="form.foundedDate"
        :input-id="`${idPrefix}-founded`"
        date-format="dd/mm/yy"
        placeholder="DD/MM/AAAA"
        show-icon
        icon-display="input"
        fluid
        :pt="modalDatePickerPt"
      >
        <template #inputicon="{ clickCallback }">
          <Calendar v-bind="modalFieldIconProps" @click="clickCallback" />
        </template>
      </DatePicker>
    </FormField>

    <FormField label="Descrição" :input-id="`${idPrefix}-description`" compact>
      <Textarea
        :id="`${idPrefix}-description`"
        v-model="form.description"
        placeholder="Opcional"
        class="w-full"
        :class="modalTextareaClass"
      />
    </FormField>

    <Message v-if="validationError || props.error" severity="error" :closable="false">
      {{ validationError ?? props.error }}
    </Message>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        outlined
        :disabled="loading"
        :class="secondaryButtonMdClass"
        @click="onUpdateVisible(false)"
      />
      <Button label="Salvar alterações" :loading="loading" :class="primaryButtonMdClass" @click="onSave" />
    </template>
  </Dialog>
</template>
