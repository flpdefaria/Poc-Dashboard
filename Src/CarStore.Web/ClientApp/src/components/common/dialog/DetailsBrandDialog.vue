<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { formatDate } from "../../../utils/format";
import { modalDialogPt, modalDialogTitleClass } from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import type { BrandDto } from "../../../types";
import { Building, Pencil, X } from "@lucide/vue";

const props = defineProps<{
  visible: boolean;
  brand: BrandDto | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean]; edit: [brand: BrandDto] }>();

// Figma details-dialog (Brands 2113:2596): 400px.
const dialogPt = modalDialogPt("w-[400px]");

function onEdit() {
  if (props.brand) emit("edit", props.brand);
}
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
    <!-- Header (2113:2597): 36px icon box on the sunken surface, brand name, country line. -->
    <template #header>
      <!-- Initial focus: without an [autofocus] element PrimeVue Dialog focuses the close button with a visible ring,
           which Figma does not draw. The header block takes it instead (tabindex -1: not in the Tab order, no outline). -->
      <div class="flex min-w-0 flex-1 items-center gap-2 outline-none" autofocus tabindex="-1">
        <div class="flex shrink-0 rounded-md bg-sunken p-2 text-color">
          <Building class="size-5" :stroke-width="1.5" absolute-stroke-width />
        </div>
        <div v-if="props.brand" class="flex min-w-0 flex-1 flex-col">
          <span :class="modalDialogTitleClass" class="truncate">{{ props.brand.name }}</span>
          <p v-if="props.brand.country" class="truncate text-xs leading-4 text-muted-color">{{ props.brand.country }}</p>
        </div>
      </div>
    </template>
    <template #closeicon><X /></template>

    <template v-if="props.brand">
      <!-- Stats (2113:2610): sunken box, 16px padding and gap, three equal columns. -->
      <dl class="flex gap-4 rounded-md bg-sunken p-4">
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Fundação</dt>
          <dd class="text-sm font-semibold text-color">{{ formatDate(props.brand.foundedDate) }}</dd>
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Anos de atuação</dt>
          <dd class="text-sm font-semibold text-color">{{ props.brand.yearsInBusiness }}</dd>
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Carros</dt>
          <dd class="text-sm font-semibold text-color">{{ props.brand.carsCount }}</dd>
        </div>
      </dl>

      <!-- "Carros da marca" (2113:2620): 8px rows divided by surface-200, model left (600), model year right (muted). -->
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold text-color">Carros da marca</h3>
        <ul v-if="props.brand.cars.length" class="flex flex-col">
          <li
            v-for="(car, index) in props.brand.cars"
            :key="`${car.model}-${index}`"
            class="flex items-center gap-4 border-b border-surface-200 py-2 last:border-b-0"
          >
            <p class="min-w-0 flex-1 text-sm font-semibold text-color">{{ car.model }}</p>
            <p class="shrink-0 text-xs leading-4 text-muted-color">{{ car.modelYear }}</p>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-color">Nenhum carro cadastrado.</p>
      </section>

      <section class="flex flex-col gap-2 text-sm text-color">
        <h3 class="font-semibold">Descrição</h3>
        <p :class="{ 'text-muted-color': !props.brand.description }">{{ props.brand.description || "Sem descrição." }}</p>
      </section>
    </template>

    <template #footer>
      <Button
        label="Fechar"
        severity="secondary"
        outlined
        :class="secondaryButtonMdClass"
        @click="emit('update:visible', false)"
      />
      <Button label="Editar" :disabled="!props.brand" :class="primaryButtonMdClass" @click="onEdit">
        <template #icon><Pencil /></template>
      </Button>
    </template>
  </Dialog>
</template>
