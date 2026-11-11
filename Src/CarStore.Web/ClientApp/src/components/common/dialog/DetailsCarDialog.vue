<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Tag from "primevue/tag";
import { formatCurrency } from "../../../utils/format";
import { modalDialogPt, modalDialogTitleClass } from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import { tagPt } from "../../../styles/tagStyles";
import type { CarDto } from "../../../types";
import { Car, Pencil, X } from "@lucide/vue";

const props = defineProps<{
  visible: boolean;
  car: CarDto | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean]; edit: [car: CarDto] }>();

// Figma details-dialog (Cars 2074:3769): 400px.
const dialogPt = modalDialogPt("w-[400px]");

function onEdit() {
  if (props.car) emit("edit", props.car);
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
    <!-- Header (2076:3832): 36px icon box on the sunken surface, title + availability tag, "Brand · Body" line. -->
    <template #header>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <div class="flex shrink-0 rounded-md bg-sunken p-2 text-color">
          <Car class="size-5" :stroke-width="1.5" absolute-stroke-width />
        </div>
        <div v-if="props.car" class="flex min-w-0 flex-1 flex-col">
          <div class="flex min-w-0 items-center gap-2">
            <span :class="modalDialogTitleClass" class="flex-none truncate">{{ props.car.model }}</span>
            <Tag
              :value="props.car.isAvailable ? 'Disponível' : 'Indisponível'"
              :severity="props.car.isAvailable ? 'success' : 'danger'"
              :pt="tagPt"
              class="self-center!"
            />
          </div>
          <p class="truncate text-xs leading-4 text-muted-color">{{ props.car.brandName }} · {{ props.car.bodyType }}</p>
        </div>
      </div>
    </template>
    <template #closeicon><X /></template>

    <template v-if="props.car">
      <!-- Price (2076:3846): body/sm label over display/sm value (32px / 40px, 600, -0.64px). -->
      <div class="flex flex-col">
        <p class="text-xs leading-4 text-muted-color">Preço</p>
        <p class="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-color">{{ formatCurrency(props.car.price) }}</p>
      </div>

      <!-- Stats (2076:3849): sunken box, 16px padding and gap, three equal columns. -->
      <dl class="flex gap-4 rounded-md bg-sunken p-4">
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Estoque</dt>
          <dd class="text-sm font-semibold text-color">{{ props.car.stock }} un.</dd>
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Quilometragem</dt>
          <dd class="text-sm font-semibold text-color">{{ props.car.mileage }}</dd>
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <dt class="truncate text-xs leading-4 text-muted-color">Ano do modelo</dt>
          <dd class="text-sm font-semibold text-color">{{ props.car.modelYear }}</dd>
        </div>
      </dl>

      <!-- Specs (2076:3872): 8px rows divided by surface-200, label left (body/sm muted), value right. -->
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold text-color">Especificações</h3>
        <dl class="flex flex-col">
          <div class="flex items-center gap-4 border-b border-surface-200 py-2">
            <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">Marca</dt>
            <dd class="text-sm text-color">{{ props.car.brandName }}</dd>
          </div>
          <div class="flex items-center gap-4 border-b border-surface-200 py-2">
            <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">Carroceria</dt>
            <dd class="text-sm text-color">{{ props.car.bodyType }}</dd>
          </div>
          <div class="flex items-center gap-4 py-2">
            <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">Chassi (VIN)</dt>
            <dd class="font-mono text-xs leading-4 text-color">{{ props.car.vin || "—" }}</dd>
          </div>
        </dl>
      </section>

      <section class="flex flex-col gap-2 text-sm text-color">
        <h3 class="font-semibold">Descrição</h3>
        <p :class="{ 'text-muted-color': !props.car.description }">{{ props.car.description || "Sem descrição." }}</p>
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
      <Button label="Editar" :disabled="!props.car" :class="primaryButtonMdClass" @click="onEdit">
        <template #icon><Pencil /></template>
      </Button>
    </template>
  </Dialog>
</template>
