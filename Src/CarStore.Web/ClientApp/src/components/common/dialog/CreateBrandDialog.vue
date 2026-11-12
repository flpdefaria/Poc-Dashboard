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
  modalTextareaShortClass,
} from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import { Calendar, X } from "@lucide/vue";

export interface CreateBrandPayload {
  name: string;
  country: string;
  foundedDate: string;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateBrandPayload];
  cancel: [];
}>();

function emptyForm() {
  return {
    name: "",
    country: "",
    foundedDate: null as Date | null,
    description: "",
  };
}

const form = reactive(emptyForm());
const validationError = ref<string | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, emptyForm());
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

// Figma form-dialog "Nova marca" (2113:4425): 400px.
const dialogPt = modalDialogPt("w-[400px]");
const idPrefix = "create-brand";
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
      <span :class="modalDialogTitleClass" class="outline-none" autofocus tabindex="-1">Nova marca</span>
    </template>
    <template #closeicon><X /></template>

    <FormField label="Nome" :input-id="`${idPrefix}-name`" compact>
      <InputText
        :id="`${idPrefix}-name`"
        v-model="form.name"
        placeholder="Ex.: Volkswagen"
        class="w-full"
        :class="modalInputClass"
      />
    </FormField>

    <FormField label="País" :input-id="`${idPrefix}-country`" compact>
      <InputText
        :id="`${idPrefix}-country`"
        v-model="form.country"
        placeholder="Ex.: Alemanha"
        class="w-full"
        :class="modalInputClass"
      />
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
        :class="modalTextareaShortClass"
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
      <Button label="Cadastrar marca" :loading="loading" :class="primaryButtonMdClass" @click="onSave" />
    </template>
  </Dialog>
</template>
