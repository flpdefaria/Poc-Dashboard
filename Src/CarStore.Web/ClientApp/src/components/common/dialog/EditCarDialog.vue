<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import FormField from "../form/FormField.vue";
import { dialogShellPt, dialogSecondaryButtonClass, dialogPrimaryButtonClass } from "./dialogStyles";
import type { BrandOption, CarDto } from "../../../types";
import { Check } from "@lucide/vue";

export interface EditCarPayload {
  model: string;
  vin: string;
  brandId: number;
  bodyType: string;
  modelYear: number;
  price: number;
  stock: number;
  mileage: number;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  car: CarDto | null;
  brands: BrandOption[];
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: EditCarPayload];
  cancel: [];
}>();

function formFromCar(car: CarDto | null) {
  return {
    model: car?.model ?? "",
    vin: car?.vin ?? "",
    brandId: car?.brandId ?? (null as number | null),
    bodyType: car?.bodyType ?? "",
    modelYear: car?.modelYear ?? (null as number | null),
    price: car?.price ?? (null as number | null),
    stock: car?.stock ?? (null as number | null),
    mileage: car?.mileage ?? (null as number | null),
    description: car?.description ?? "",
  };
}

const form = reactive(formFromCar(props.car));
const validationError = ref<string | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, formFromCar(props.car));
      validationError.value = null;
    }
  },
);

function onUpdateVisible(value: boolean) {
  emit("update:visible", value);
  if (!value) emit("cancel");
}

function onSave() {
  if (!form.model.trim() || !form.brandId) {
    validationError.value = "Modelo e marca são obrigatórios.";
    return;
  }
  validationError.value = null;
  emit("submit", {
    model: form.model.trim(),
    vin: form.vin.trim(),
    brandId: form.brandId,
    bodyType: form.bodyType.trim(),
    modelYear: form.modelYear ?? new Date().getFullYear(),
    price: form.price ?? 0,
    stock: form.stock ?? 0,
    mileage: form.mileage ?? 0,
    description: form.description.trim(),
  });
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
      <span class="text-[21px] font-bold text-color">Editar carro</span>
    </template>

    <FormField label="Modelo">
      <InputText v-model="form.model" class="w-full" />
    </FormField>

    <FormField label="Chassi (VIN)">
      <InputText v-model="form.vin" class="w-full" />
    </FormField>

    <div class="flex w-full items-start gap-[21px]">
      <FormField label="Marca">
        <Select
          v-model="form.brandId"
          :options="props.brands"
          option-label="name"
          option-value="id"
          placeholder="Selecione uma marca"
          class="w-full"
        />
      </FormField>
      <FormField label="Carroceria">
        <InputText v-model="form.bodyType" class="w-full" />
      </FormField>
      <FormField label="Ano do modelo">
        <InputNumber v-model="form.modelYear" :use-grouping="false" class="w-full" />
      </FormField>
    </div>

    <div class="flex w-full items-start gap-[21px]">
      <FormField label="Preço">
        <InputNumber v-model="form.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
      </FormField>
      <FormField label="Estoque">
        <InputNumber v-model="form.stock" :min="0" class="w-full" />
      </FormField>
      <FormField label="Quilometragem">
        <InputNumber v-model="form.mileage" :min="0" disabled class="w-full opacity-50" />
      </FormField>
    </div>

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
