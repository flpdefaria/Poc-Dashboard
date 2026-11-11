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
import { tagPt } from "../styles/tagStyles";
import type { BrandOption, CarDto } from "../types";
import type { ConfirmDeleteItem } from "./common/dialog/ConfirmDeleteDialog.vue";

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

// Delete dialogs (Figma 2072:2729): one list row per car, "Brand · Body" subtitle and the price.
function toDeleteItem(car: CarDto): ConfirmDeleteItem {
  return { key: car.id, title: car.model, subtitle: `${car.brandName} · ${car.bodyType}`, meta: formatCurrency(car.price) };
}

function carsCount(count: number) {
  return count === 1 ? "1 carro" : `${count} carros`;
}

// Details "Editar" (Figma 2074:3820) hands the car straight to the edit dialog.
function onDetailsEdit(car: CarDto) {
  detailsDialogVisible.value = false;
  onEditRequest(car);
}

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
    card
    @page="onPage"
    @delete="onDeleteRequest"
    @edit="onEditRequest"
    @details="onDetailsRequest"
    @bulk-delete="onBulkDeleteRequest"
  >
    <template #col-price="{ data }">
      <span>{{ formatCurrency(data.price) }}</span>
    </template>
    <template #col-isAvailable="{ data }">
      <Tag :value="data.isAvailable ? 'Sim' : 'Não'" :severity="data.isAvailable ? 'success' : 'danger'" :pt="tagPt" />
    </template>
  </DataTableCommon>

  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    title="Excluir carro?"
    message="O carro abaixo será removido do estoque:"
    :items="deleteTarget ? [toDeleteItem(deleteTarget)] : []"
    confirm-label="Excluir carro"
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteDialog
    v-model:visible="bulkDeleteDialogVisible"
    :title="`Excluir ${carsCount(bulkDeleteTargets.length)}?`"
    :message="
      bulkDeleteTargets.length === 1
        ? 'O carro abaixo será removido do estoque:'
        : 'Os carros abaixo serão removidos do estoque:'
    "
    :items="bulkDeleteTargets.map(toDeleteItem)"
    :confirm-label="`Excluir ${carsCount(bulkDeleteTargets.length)}`"
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

  <DetailsCarDialog v-model:visible="detailsDialogVisible" :car="detailsTarget" @edit="onDetailsEdit" />
</template>

