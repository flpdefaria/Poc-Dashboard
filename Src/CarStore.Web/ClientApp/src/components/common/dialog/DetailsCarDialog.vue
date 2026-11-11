<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Tag from "primevue/tag";
import DetailField from "../form/DetailField.vue";
import { formatCurrency } from "../../../utils/format";
import { detailsDialogPt, dialogSecondaryButtonClass } from "./dialogStyles";
import type { CarDto } from "../../../types";

const props = defineProps<{
  visible: boolean;
  car: CarDto | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean] }>();

const dialogPt = detailsDialogPt("w-[520px]");
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(value: boolean) => emit('update:visible', value)"
    modal
    dismissable-mask
    :draggable="false"
    :pt="dialogPt"
  >
    <template #header>
      <span class="text-[21px] font-bold text-color">Detalhes</span>
    </template>

    <template v-if="props.car">
      <p class="text-xs font-bold uppercase tracking-wide text-color">{{ props.car.model }}</p>

      <DetailField label="Marca">
        <p class="text-sm font-medium text-color">{{ props.car.brandName }}</p>
      </DetailField>

      <div class="h-px w-full bg-surface-300 my-3.5" />

      <div class="flex w-full items-start gap-1.75">
        <DetailField label="Carroceria">
          <p class="text-sm font-medium text-color">{{ props.car.bodyType }}</p>
        </DetailField>
        <DetailField label="Ano do modelo">
          <p class="text-sm font-medium text-color">{{ props.car.modelYear }}</p>
        </DetailField>
      </div>

      <div class="flex w-full items-start gap-1.75">
        <DetailField label="Chassi (VIN)">
          <p class="text-sm font-medium text-color">{{ props.car.vin }}</p>
        </DetailField>
        <DetailField label="Quilometragem">
          <p class="text-sm font-medium text-color">{{ props.car.mileage }}</p>
        </DetailField>
      </div>

      <div class="flex w-full items-start gap-1.75">
        <DetailField label="Preço">
          <p class="text-sm font-medium text-color">{{ formatCurrency(props.car.price) }}</p>
        </DetailField>
        <DetailField label="Estoque">
          <p class="text-sm font-medium text-color">{{ props.car.stock }}</p>
        </DetailField>
      </div>

      <DetailField label="Disponível">
        <Tag :value="props.car.isAvailable ? 'Sim' : 'Não'" :severity="props.car.isAvailable ? 'success' : 'danger'" />
      </DetailField>

      <div class="h-px w-full bg-surface-300 my-3.5" />

      <DetailField label="Descrição">
        <p class="text-sm font-medium text-color">{{ props.car.description }}</p>
      </DetailField>
    </template>

    <template #footer>
      <Button
        label="Fechar"
        severity="secondary"
        outlined
        :class="dialogSecondaryButtonClass"
        @click="emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>
