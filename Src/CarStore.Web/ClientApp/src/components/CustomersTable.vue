<script setup lang="ts">
import { onMounted, ref } from "vue";
import { type DataTablePageEvent } from "primevue/datatable";
import Message from "primevue/message";
import DataTableCommon, { type DataTableColumn } from "./common/table/DataTableCommon.vue";
import ConfirmDeleteDialog from "./common/dialog/ConfirmDeleteDialog.vue";
import EditCustomerDialog, { type EditCustomerPayload } from "./common/dialog/EditCustomerDialog.vue";
import DetailsCustomerDialog from "./common/dialog/DetailsCustomerDialog.vue";
import { usePagedFetch } from "../composables/usePagedFetch";
import { useEntityCrud } from "../composables/useEntityCrud";
import { formatDate } from "../utils/format";
import { customerLabel } from "../utils/entityLabel";
import type { CarOption, CustomerDto } from "../types";
import type { ConfirmDeleteItem } from "./common/dialog/ConfirmDeleteDialog.vue";

const props = defineProps<{
  apiUrl: string;
  /** Car lookup for the Edit dialog's "Carro" field. */
  cars: CarOption[];
}>();

const rows = ref(10);
const first = ref(0);
const { items: customers, totalRecords, loading, error, load } = usePagedFetch<CustomerDto>(props.apiUrl);

const columns: DataTableColumn[] = [
  { field: "fullName", header: "Nome completo", primary: true },
  { field: "email", header: "E-mail" },
  { field: "phoneNumber", header: "Telefone" },
  { field: "createdAt", header: "Cadastrado em" },
];

function onPage(event: DataTablePageEvent) {
  first.value = event.first;
  rows.value = event.rows;
  load(event.page + 1, event.rows);
}

const {
  deleteDialogVisible,
  deleteTarget,
  deleteLoading,
  deleteError,
  onDeleteRequest,
  onDeleteConfirm,
  bulkDeleteDialogVisible,
  bulkDeleteTargets,
  bulkDeleteLoading,
  bulkDeleteError,
  onBulkDeleteRequest,
  onBulkDeleteConfirm,
  editDialogVisible,
  editTarget,
  editLoading,
  editError,
  onEditRequest,
  onEditSubmit,
  detailsDialogVisible,
  detailsTarget,
  onDetailsRequest,
} = useEntityCrud<CustomerDto, EditCustomerPayload>({
  apiUrl: props.apiUrl,
  entityLabel: customerLabel,
  reload: () => load(Math.floor(first.value / rows.value) + 1, rows.value),
});

// Delete dialogs (Figma 2134:1687): one list row per customer, e-mail subtitle and the phone on the right.
function customersLabel(count: number) {
  return count === 1 ? "1 cliente" : `${count} clientes`;
}

function toDeleteItem(customer: CustomerDto): ConfirmDeleteItem {
  return { key: customer.id, title: customer.fullName, subtitle: customer.email, meta: customer.phoneNumber || undefined };
}

// Details "Editar" (Figma 2134:848) hands the customer straight to the edit dialog.
function onDetailsEdit(customer: CustomerDto) {
  detailsDialogVisible.value = false;
  onEditRequest(customer);
}

onMounted(() => load(1, rows.value));

defineExpose({ reload: () => load(1, rows.value) });
</script>

<template>
  <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
  <DataTableCommon
    :effect-scope="apiUrl"
    :value="customers"
    :columns="columns"
    :loading="loading"
    :total-records="totalRecords"
    :first="first"
    :rows="rows"
    confirm-details
    confirm-delete
    confirm-edit
    bulk-delete
    card
    @page="onPage"
    @delete="onDeleteRequest"
    @edit="onEditRequest"
    @details="onDetailsRequest"
    @bulk-delete="onBulkDeleteRequest"
  >
    <!-- Figma 2134:11: plain body/md cells; a customer without phone shows an em dash. -->
    <template #col-phoneNumber="{ data }">
      <span>{{ data.phoneNumber || "—" }}</span>
    </template>
    <template #col-createdAt="{ data }">
      <span>{{ formatDate(data.createdAt) }}</span>
    </template>
  </DataTableCommon>

  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    :title="deleteTarget ? `Excluir ${deleteTarget.fullName}?` : 'Excluir cliente?'"
    message="O cliente será removido do cadastro:"
    :items="deleteTarget ? [toDeleteItem(deleteTarget)] : []"
    confirm-label="Excluir cliente"
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteDialog
    v-model:visible="bulkDeleteDialogVisible"
    :title="`Excluir ${customersLabel(bulkDeleteTargets.length)}?`"
    :message="bulkDeleteTargets.length === 1 ? 'O cliente será removido do cadastro:' : 'Os clientes serão removidos do cadastro:'"
    :items="bulkDeleteTargets.map(toDeleteItem)"
    :confirm-label="`Excluir ${customersLabel(bulkDeleteTargets.length)}`"
    :loading="bulkDeleteLoading"
    :error="bulkDeleteError"
    @confirm="onBulkDeleteConfirm"
  />

  <EditCustomerDialog
    v-model:visible="editDialogVisible"
    :customer="editTarget"
    :cars="props.cars"
    :loading="editLoading"
    :error="editError"
    @submit="onEditSubmit"
  />

  <DetailsCustomerDialog v-model:visible="detailsDialogVisible" :customer="detailsTarget" @edit="onDetailsEdit" />
</template>

