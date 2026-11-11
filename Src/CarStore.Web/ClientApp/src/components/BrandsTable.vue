<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { type DataTablePageEvent } from "primevue/datatable";
import Message from "primevue/message";
import DataTableCommon, { type DataTableColumn } from "./common/table/DataTableCommon.vue";
import ConfirmDeleteDialog from "./common/dialog/ConfirmDeleteDialog.vue";
import EditBrandDialog, { type EditBrandPayload } from "./common/dialog/EditBrandDialog.vue";
import DetailsBrandDialog from "./common/dialog/DetailsBrandDialog.vue";
import { usePagedFetch } from "../composables/usePagedFetch";
import { useEntityCrud } from "../composables/useEntityCrud";
import { formatDate } from "../utils/format";
import { brandLabel } from "../utils/entityLabel";
import type { BrandDto } from "../types";

const props = defineProps<{
  apiUrl: string;
}>();

const rows = ref(10);
const first = ref(0);
const { items: brands, totalRecords, loading, error, load } = usePagedFetch<BrandDto>(props.apiUrl);

const columns: DataTableColumn[] = [
  { field: "name", header: "Nome", primary: true },
  { field: "country", header: "País" },
  { field: "foundedDate", header: "Fundação" },
  { field: "yearsInBusiness", header: "Anos de atuação" },
  { field: "carsCount", header: "Carros" },
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
} = useEntityCrud<BrandDto, EditBrandPayload>({
  apiUrl: props.apiUrl,
  entityLabel: brandLabel,
  reload: () => load(Math.floor(first.value / rows.value) + 1, rows.value),
});

const bulkDeleteBlockedBrands = computed(() => bulkDeleteTargets.value.filter((brand) => brand.carsCount > 0));

onMounted(() => load(1, rows.value));

defineExpose({ reload: () => load(1, rows.value) });
</script>


<template>
  <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
  <DataTableCommon
    :effect-scope="apiUrl"
    :value="brands"
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
    <template #col-foundedDate="{ data }">
      <span class="text-xs text-muted-color">{{ formatDate(data.foundedDate) }}</span>
    </template>
  </DataTableCommon>

  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    title="Excluir marca"
    message="Tem certeza de que deseja excluir esta marca?"
    :details="
      deleteTarget
        ? [
            { label: 'Nome', value: deleteTarget.name },
            { label: 'País', value: deleteTarget.country },
            { label: 'Carros', value: String(deleteTarget.carsCount) },
          ]
        : []
    "
    :confirm-disabled="!!deleteTarget && deleteTarget.carsCount > 0"
    :warning="
      deleteTarget && deleteTarget.carsCount > 0
        ? `Esta marca tem ${deleteTarget.carsCount} carro(s) cadastrado(s). Remova-os ou transfira-os antes de excluir a marca.`
        : null
    "
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteDialog
    v-model:visible="bulkDeleteDialogVisible"
    title="Excluir marcas"
    :message="`Tem certeza de que deseja excluir ${bulkDeleteTargets.length} marca(s)?`"
    :details="bulkDeleteTargets.map((brand) => ({ label: brand.name, value: `${brand.carsCount} carro(s)` }))"
    :confirm-disabled="bulkDeleteBlockedBrands.length > 0"
    :warning="
      bulkDeleteBlockedBrands.length > 0
        ? `${bulkDeleteBlockedBrands.map((brand) => brand.name).join(', ')} ainda ${bulkDeleteBlockedBrands.length === 1 ? 'tem' : 'têm'} carros cadastrados. Remova-os ou transfira-os antes de excluir.`
        : null
    "
    :loading="bulkDeleteLoading"
    :error="bulkDeleteError"
    @confirm="onBulkDeleteConfirm"
  />

  <EditBrandDialog
    v-model:visible="editDialogVisible"
    :brand="editTarget"
    :loading="editLoading"
    :error="editError"
    @submit="onEditSubmit"
  />

  <DetailsBrandDialog v-model:visible="detailsDialogVisible" :brand="detailsTarget" />
</template>

