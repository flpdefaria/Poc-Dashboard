<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import FormField from "../form/FormField.vue";
import {
  modalDialogPt,
  modalDialogTitleClass,
  modalInputClass,
  modalSelectPt,
  modalSelectChevronProps,
  modalFieldIconProps,
} from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import type { CarOption, CustomerDto } from "../../../types";
import { ChevronDown, Search, X } from "@lucide/vue";

export interface EditCustomerPayload {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  /** Linked car; null = no car (PUT replaces every field, so clearing the Select unlinks the car). */
  carId: number | null;
}

const props = defineProps<{
  visible: boolean;
  customer: CustomerDto | null;
  /** Car lookup (`GET /api/cars/options`), loaded by the page. */
  cars: CarOption[];
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: EditCustomerPayload];
  cancel: [];
}>();

function formFromCustomer(customer: CustomerDto | null) {
  return {
    fullName: customer?.fullName ?? "",
    email: customer?.email ?? "",
    phoneNumber: customer?.phoneNumber ?? "",
    carId: customer?.carId ?? null,
  };
}

const form = reactive(formFromCustomer(props.customer));
const validationError = ref<string | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, formFromCustomer(props.customer));
      validationError.value = null;
    }
  },
);

function onUpdateVisible(value: boolean) {
  emit("update:visible", value);
  if (!value) emit("cancel");
}

function onSave() {
  if (!form.fullName.trim() || !form.email.trim()) {
    validationError.value = "Nome completo e e-mail são obrigatórios.";
    return;
  }
  validationError.value = null;
  emit("submit", {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phoneNumber.trim() || null,
    carId: form.carId ?? null,
  });
}

// Figma form-dialog "Editar cliente" (2134:1115): 400px.
const dialogPt = modalDialogPt("w-[400px]");
const idPrefix = "edit-customer";
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
      <span :class="modalDialogTitleClass" class="outline-none" autofocus tabindex="-1">Editar cliente</span>
    </template>
    <template #closeicon><X /></template>

    <FormField label="Nome completo" :input-id="`${idPrefix}-name`" compact>
      <InputText
        :id="`${idPrefix}-name`"
        v-model="form.fullName"
        placeholder="Ex.: Maria Silva"
        class="w-full"
        :class="modalInputClass"
      />
    </FormField>

    <FormField label="E-mail" :input-id="`${idPrefix}-email`" compact>
      <InputText
        :id="`${idPrefix}-email`"
        v-model="form.email"
        type="email"
        placeholder="nome@email.com"
        class="w-full"
        :class="modalInputClass"
      />
    </FormField>

    <FormField label="Telefone" :input-id="`${idPrefix}-phone`" compact>
      <InputText
        :id="`${idPrefix}-phone`"
        v-model="form.phoneNumber"
        type="tel"
        placeholder="(00) 00000-0000"
        class="w-full"
        :class="modalInputClass"
      />
    </FormField>

    <!-- Figma select (2135:2862): placeholder "Sem carro"; filter + clear kept from the previous dialog (ticket). -->
    <FormField label="Carro" :input-id="`${idPrefix}-car`" compact>
      <Select
        v-model="form.carId"
        :input-id="`${idPrefix}-car`"
        :options="props.cars"
        option-label="name"
        option-value="id"
        placeholder="Sem carro"
        filter
        filter-placeholder="Buscar carro"
        show-clear
        empty-filter-message="Nenhum carro encontrado"
        fluid
        :pt="modalSelectPt"
      >
        <template #dropdownicon><ChevronDown v-bind="modalSelectChevronProps" /></template>
        <template #clearicon="{ clearCallback }">
          <X v-bind="modalFieldIconProps" class="p-select-clear-icon" @click="clearCallback" />
        </template>
        <template #filtericon><Search v-bind="modalFieldIconProps" /></template>
      </Select>
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
