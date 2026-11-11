<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import FormField from "../form/FormField.vue";
import { dialogShellPt, dialogSecondaryButtonClass, dialogPrimaryButtonClass } from "./dialogStyles";
import type { CarOption, CustomerDto } from "../../../types";
import { Check } from "@lucide/vue";

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
      <span class="text-[21px] font-bold text-color">Editar cliente</span>
    </template>

    <FormField label="Nome completo">
      <InputText v-model="form.fullName" class="w-full" />
    </FormField>

    <FormField label="E-mail">
      <InputText v-model="form.email" class="w-full" />
    </FormField>

    <FormField label="Telefone">
      <InputText v-model="form.phoneNumber" class="w-full" />
    </FormField>

    <FormField label="Carro">
      <Select
        v-model="form.carId"
        :options="props.cars"
        option-label="name"
        option-value="id"
        placeholder="Sem carro"
        filter
        filter-placeholder="Buscar carro"
        show-clear
        empty-filter-message="Nenhum carro encontrado"
        class="w-full"
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
