<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { formatDate } from "../../../utils/format";
import { modalDialogPt, modalDialogTitleClass } from "./dialogStyles";
import { primaryButtonMdClass, secondaryButtonMdClass } from "../../../styles/buttonStyles";
import type { CustomerDto } from "../../../types";
import { IdCard, Pencil, X } from "@lucide/vue";

const props = defineProps<{
  visible: boolean;
  customer: CustomerDto | null;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean]; edit: [customer: CustomerDto] }>();

// Figma details-dialog (Customers 2134:811): 400px.
const dialogPt = modalDialogPt("w-[400px]");

function onEdit() {
  if (props.customer) emit("edit", props.customer);
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
    <!-- Header (2134:812): 36px icon box on the sunken surface, full name, "Cliente desde" line. -->
    <template #header>
      <!-- Initial focus: without an [autofocus] element PrimeVue Dialog focuses the close button with a visible ring,
           which Figma does not draw. The header block takes it instead (tabindex -1: not in the Tab order, no outline). -->
      <div class="flex min-w-0 flex-1 items-center gap-2 outline-none" autofocus tabindex="-1">
        <div class="flex shrink-0 rounded-md bg-sunken p-2 text-color">
          <IdCard class="size-5" :stroke-width="1.5" absolute-stroke-width />
        </div>
        <div v-if="props.customer" class="flex min-w-0 flex-1 flex-col">
          <span :class="modalDialogTitleClass" class="truncate">{{ props.customer.fullName }}</span>
          <p class="truncate text-xs leading-4 text-muted-color">Cliente desde {{ formatDate(props.customer.createdAt) }}</p>
        </div>
      </div>
    </template>
    <template #closeicon><X /></template>

    <!-- "Informações" (2134:831): 8px rows divided by surface-200, label left (body/sm muted), value right (body/md). -->
    <section v-if="props.customer" class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-color">Informações</h3>
      <dl class="flex flex-col">
        <div class="flex items-center gap-4 border-b border-surface-200 py-2">
          <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">E-mail</dt>
          <dd class="min-w-0 truncate text-sm text-color">{{ props.customer.email }}</dd>
        </div>
        <div class="flex items-center gap-4 border-b border-surface-200 py-2">
          <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">Telefone</dt>
          <dd class="min-w-0 truncate text-sm text-color">{{ props.customer.phoneNumber || "—" }}</dd>
        </div>
        <div class="flex items-center gap-4 py-2">
          <dt class="min-w-0 flex-1 text-xs leading-4 text-muted-color">Carro</dt>
          <dd class="min-w-0 truncate text-sm text-color">{{ props.customer.carName || "—" }}</dd>
        </div>
      </dl>
    </section>

    <template #footer>
      <Button
        label="Fechar"
        severity="secondary"
        outlined
        :class="secondaryButtonMdClass"
        @click="emit('update:visible', false)"
      />
      <Button label="Editar" :disabled="!props.customer" :class="primaryButtonMdClass" @click="onEdit">
        <template #icon><Pencil /></template>
      </Button>
    </template>
  </Dialog>
</template>
