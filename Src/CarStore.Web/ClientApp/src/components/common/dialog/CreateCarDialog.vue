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
import {
  modalDialogPt,
  modalDialogTitleClass,
  modalInputClass,
  modalInputNumberPt,
  modalSelectPt,
  modalTextareaClass,
} from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import type { BrandOption } from "../../../types";
import { X } from "@lucide/vue";

export interface CreateCarPayload {
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
  brands: BrandOption[];
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateCarPayload];
  cancel: [];
}>();

function emptyForm() {
  return {
    model: "",
    vin: "",
    brandId: null as number | null,
    bodyType: "",
    modelYear: null as number | null,
    price: null as number | null,
    stock: null as number | null,
    mileage: null as number | null,
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

// Figma form-dialog (2075:4909 edit / 2075:5049 create): 400px.
const dialogPt = modalDialogPt("w-[400px]");
const idPrefix = "create-car";
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
      <span :class="modalDialogTitleClass">Novo carro</span>
    </template>
    <template #closeicon><X /></template>

    <FormField label="Modelo" :input-id="`${idPrefix}-model`" compact>
      <InputText :id="`${idPrefix}-model`" v-model="form.model" placeholder="Ex.: Corolla" class="w-full" :class="modalInputClass" />
    </FormField>

    <FormField label="Chassi (VIN)" :input-id="`${idPrefix}-vin`" compact>
      <InputText :id="`${idPrefix}-vin`" v-model="form.vin" placeholder="17 caracteres" class="w-full" :class="modalInputClass" />
    </FormField>

    <div class="flex w-full items-start gap-4">
      <FormField label="Marca" :input-id="`${idPrefix}-brand`" compact>
        <Select
          v-model="form.brandId"
          :input-id="`${idPrefix}-brand`"
          :options="props.brands"
          option-label="name"
          option-value="id"
          placeholder="Marca"
          fluid
          :pt="modalSelectPt"
        />
      </FormField>
      <FormField label="Carroceria" :input-id="`${idPrefix}-body`" compact>
        <InputText :id="`${idPrefix}-body`" v-model="form.bodyType" placeholder="Ex.: SUV" class="w-full" :class="modalInputClass" />
      </FormField>
    </div>

    <div class="flex w-full items-start gap-4">
      <FormField label="Ano do modelo" :input-id="`${idPrefix}-year`" compact>
        <InputNumber
          v-model="form.modelYear"
          :input-id="`${idPrefix}-year`"
          :use-grouping="false"
          placeholder="AAAA"
          fluid
          :pt="modalInputNumberPt"
        />
      </FormField>
      <FormField label="Quilometragem" :input-id="`${idPrefix}-mileage`" compact>
        <InputNumber
          v-model="form.mileage"
          :input-id="`${idPrefix}-mileage`"
          :min="0"
          placeholder="0"
          fluid
          :pt="modalInputNumberPt"
        />
      </FormField>
    </div>

    <div class="flex w-full items-start gap-4">
      <FormField label="Preço" :input-id="`${idPrefix}-price`" compact>
        <InputNumber
          v-model="form.price"
          :input-id="`${idPrefix}-price`"
          mode="currency"
          currency="BRL"
          locale="pt-BR"
          placeholder="R$ 0,00"
          fluid
          :pt="modalInputNumberPt"
        />
      </FormField>
      <FormField label="Estoque" :input-id="`${idPrefix}-stock`" compact>
        <InputNumber
          v-model="form.stock"
          :input-id="`${idPrefix}-stock`"
          :min="0"
          placeholder="0"
          fluid
          :pt="modalInputNumberPt"
        />
      </FormField>
    </div>

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
      <Button label="Cadastrar carro" :loading="loading" :class="primaryButtonMdClass" @click="onSave" />
    </template>
  </Dialog>
</template>
