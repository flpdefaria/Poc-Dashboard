<script setup lang="ts">
import { onMounted, ref } from "vue";
import { type DataTablePageEvent } from "primevue/datatable";
import Tag from "primevue/tag";
import Message from "primevue/message";
import DataTableCommon, { type DataTableColumn } from "./common/table/DataTableCommon.vue";
import ConfirmDeleteDialog from "./common/dialog/ConfirmDeleteDialog.vue";
import EditCarDialog, { type EditCarPayload } from "./common/dialog/EditCarDialog.vue";
import DetailsCarDialog from "./common/dialog/DetailsCarDialog.vue";
import { usePagedFetch } from "../composables/usePagedFetch";
import { useEntityCrud } from "../composables/useEntityCrud";
import { formatCurrency } from "../utils/format";
import { carLabel } from "../utils/entityLabel";
import type { BrandOption, CarDto } from "../types";

const props = defineProps<{
  apiUrl: string;
  brands: BrandOption[];
}>();

const rows = ref(10);
const first = ref(0);
const { items: cars, totalRecords, loading, error, load } = usePagedFetch<CarDto>(props.apiUrl);

const columns: DataTableColumn[] = [
  { field: "model", header: "Modelo", primary: true },
  { field: "brandName", header: "Marca" },
  { field: "bodyType", header: "Carroceria" },
  { field: "price", header: "Preço" },
  { field: "stock", header: "Estoque" },
  { field: "mileage", header: "Quilometragem" },
  { field: "isAvailable", header: "Disponível" },
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
} = useEntityCrud<CarDto, EditCarPayload>({
  apiUrl: props.apiUrl,
  entityLabel: carLabel,
  reload: () => load(Math.floor(first.value / rows.value) + 1, rows.value),
});

onMounted(() => load(1, rows.value));

defineExpose({ reload: () => load(1, rows.value) });
</script>



<template>
  <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
  <DataTableCommon
    :effect-scope="apiUrl"
    :value="cars"
    :columns="columns"
    :loading="loading"
    :total-records="totalRecords"
    :first="first"
    :rows="rows"
    confirm-details
    confirm-delete
    confirm-edit
    bulk-delete
    @page="onPage"
    @delete="onDeleteRequest"
    @edit="onEditRequest"
    @details="onDetailsRequest"
    @bulk-delete="onBulkDeleteRequest"
  >
    <template #col-price="{ data }">
      <span class="text-xs text-muted-color">{{ formatCurrency(data.price) }}</span>
    </template>
    <template #col-isAvailable="{ data }">
      <Tag :value="data.isAvailable ? 'Sim' : 'Não'" :severity="data.isAvailable ? 'success' : 'danger'" />
    </template>
  </DataTableCommon>

  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    title="Excluir carro"
    message="Tem certeza de que deseja excluir este carro?"
    :details="
      deleteTarget
        ? [
            { label: 'Modelo', value: deleteTarget.model },
            { label: 'Marca', value: deleteTarget.brandName },
            { label: 'Preço', value: formatCurrency(deleteTarget.price) },
          ]
        : []
    "
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteDialog
    v-model:visible="bulkDeleteDialogVisible"
    title="Excluir carros"
    :message="`Tem certeza de que deseja excluir ${bulkDeleteTargets.length} carro(s)?`"
    :details="bulkDeleteTargets.map((car) => ({ label: car.model, value: car.brandName }))"
    :loading="bulkDeleteLoading"
    :error="bulkDeleteError"
    @confirm="onBulkDeleteConfirm"
  />

  <EditCarDialog
    v-model:visible="editDialogVisible"
    :car="editTarget"
    :brands="props.brands"
    :loading="editLoading"
    :error="editError"
    @submit="onEditSubmit"
  />

  <DetailsCarDialog v-model:visible="detailsDialogVisible" :car="detailsTarget" />
</template>

