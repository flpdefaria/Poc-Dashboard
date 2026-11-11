<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import DetailField from "../form/DetailField.vue";
import { detailsDialogPt, dialogSecondaryButtonClass } from "./dialogStyles";
import type { BrandDto } from "../../../types";

defineProps<{
  visible: boolean;
  brand: BrandDto | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean] }>();

// API dates are ISO strings ("yyyy-MM-ddTHH:mm:ss"); slicing avoids a local-timezone shift.
function formatIsoDate(value: string) {
  return value.slice(0, 10);
}

const dialogPt = detailsDialogPt("w-[520px]");
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(value: boolean) => emit('update:visible', value)"
    modal
    dismissable-mask
    :draggable="false"
    :pt="dialogPt"
  >
    <template #header>
      <span class="text-[21px] font-bold text-color">Detalhes</span>
    </template>

    <template v-if="brand">
      <DetailField label="Nome">
        <p class="text-sm font-medium text-color">{{ brand.name }}</p>
      </DetailField>

      <div class="h-px w-full bg-surface-300 my-3.5" />

      <div class="flex w-full items-start gap-1.75">
        <DetailField label="País">
          <p class="text-sm font-medium text-color">{{ brand.country }}</p>
        </DetailField>
        <DetailField label="Anos de atuação">
          <p class="text-sm font-medium text-color">{{ brand.yearsInBusiness }}</p>
        </DetailField>
      </div>

      <div class="flex w-full items-start gap-1.75">
        <DetailField label="Data de fundação">
          <p class="text-sm font-medium text-color">{{ formatIsoDate(brand.foundedDate) }}</p>
        </DetailField>
        <DetailField label="Número de carros">
          <p class="text-sm font-medium text-color">{{ brand.carsCount }}</p>
        </DetailField>
      </div>

      <DetailField label="Carros">
        <ul v-if="brand.cars.length" class="ml-[21px] list-disc text-sm font-medium text-color">
          <li v-for="car in brand.cars" :key="car.model">
            {{ car.model }} <span class="text-muted-color">({{ car.modelYear }})</span>
          </li>
        </ul>
        <p v-else class="text-sm font-medium text-muted-color">Nenhum carro cadastrado.</p>
      </DetailField>

      <div class="h-px w-full bg-surface-300 my-3.5" />

      <DetailField label="Descrição">
        <p class="text-sm font-medium text-color">{{ brand.description }}</p>
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
