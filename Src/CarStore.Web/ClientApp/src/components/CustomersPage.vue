<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import CustomersTable from "./CustomersTable.vue";
import CreateCustomerDialog, { type CreateCustomerPayload } from "./common/dialog/CreateCustomerDialog.vue";
import Button from "primevue/button";
import { primaryButtonClass } from "../styles/buttonStyles";
import { useCreateEntity } from "../composables/useCreateEntity";
import { customerLabel } from "../utils/entityLabel";
import { Plus } from "@lucide/vue";

const apiUrl = "/api/customers";

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

    <CustomersTable ref="customersTable" :api-url="apiUrl" />

    <CreateCustomerDialog
      v-model:visible="createDialogVisible"
      :loading="createLoading"
      :error="createError"
      @submit="onCreateSubmit"
    />
  </div>
</template>

