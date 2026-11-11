<script setup lang="ts">
import { onMounted, ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import CustomersTable from "./CustomersTable.vue";
import CreateCustomerDialog, { type CreateCustomerPayload } from "./common/dialog/CreateCustomerDialog.vue";
import Button from "primevue/button";
import { primaryButtonClass } from "../styles/buttonStyles";
import { useCreateEntity } from "../composables/useCreateEntity";
import { customerLabel } from "../utils/entityLabel";
import type { CarOption } from "../types";
import { Plus } from "@lucide/vue";

const apiUrl = "/api/customers";
const carsUrl = "/api/cars";

const customersTable = ref<InstanceType<typeof CustomersTable> | null>(null);

const {
  visible: createDialogVisible,
  loading: createLoading,
  error: createError,
  open: openCreate,
  submit: onCreateSubmit,
} = useCreateEntity<CreateCustomerPayload>({
  apiUrl,
  entityLabel: customerLabel,
  onCreated: () => customersTable.value?.reload(),
});

// Lookup for the "Carro" field of the create/edit dialogs (same pattern as the brand options on CarsPage).
const carOptions = ref<CarOption[]>([]);

async function loadCarOptions() {
  const response = await fetch(`${carsUrl}/options`);
  if (response.ok) carOptions.value = await response.json();
}

onMounted(loadCarOptions);
</script>

<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Clientes"
      description="Gerencie os clientes da concessionária: consulte nome completo, e-mail, telefone e data de cadastro, e crie, edite ou remova registros."
    >
      <template #actions>
        <Button
          :class="primaryButtonClass"
          @click="openCreate"
        >
          <Plus class="text-xs" />
          Novo cliente
        </Button>
      </template>
    </PageHeader>

    <CustomersTable ref="customersTable" :api-url="apiUrl" :cars="carOptions" />

    <CreateCustomerDialog
      v-model:visible="createDialogVisible"
      :cars="carOptions"
      :loading="createLoading"
      :error="createError"
      @submit="onCreateSubmit"
    />
  </div>
</template>

