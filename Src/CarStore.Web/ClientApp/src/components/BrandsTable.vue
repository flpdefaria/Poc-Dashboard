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
import type { ConfirmDeleteItem } from "./common/dialog/ConfirmDeleteDialog.vue";

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

// Delete dialogs (Figma 2114:4132 / 2113:5364): one list row per brand, country subtitle and the car count.
function carsLabel(count: number) {
  return count === 1 ? "1 carro" : `${count} carros`;
}

function brandsLabel(count: number) {
  return count === 1 ? "1 marca" : `${count} marcas`;
}

function toDeleteItem(brand: BrandDto): ConfirmDeleteItem {
  return { key: brand.id, title: brand.name, subtitle: brand.country || undefined, meta: carsLabel(brand.carsCount) };
}

function joinNames(names: string[]) {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

// A brand with cars cannot be deleted (Brand.EnsureCanBeDeleted): the dialog shows the Figma warn banner
// (2113:5369) and disables the confirm button. Copy for one brand follows the frame; the plural form is derived.
function blockedWarning(blocked: BrandDto[]) {
  if (!blocked.length) return null;
  if (blocked.length === 1) {
    const [brand] = blocked;
    const cars = brand.carsCount === 1 ? "1 carro cadastrado" : `${brand.carsCount} carros cadastrados`;
    return `${brand.name} tem ${cars}. Remova ou transfira os carros antes de excluir a marca.`;
  }
  return `${joinNames(blocked.map((brand) => brand.name))} têm carros cadastrados. Remova ou transfira os carros antes de excluir as marcas.`;
}

const deleteBlocked = computed(() => !!deleteTarget.value && deleteTarget.value.carsCount > 0);
const bulkDeleteBlockedBrands = computed(() => bulkDeleteTargets.value.filter((brand) => brand.carsCount > 0));

const bulkDeleteMessage = computed(() => {
  const count = bulkDeleteTargets.value.length;
  if (bulkDeleteBlockedBrands.value.length) return count === 1 ? "Marca selecionada:" : "Marcas selecionadas:";
  return count === 1 ? "A marca será removida do cadastro:" : "As marcas serão removidas do cadastro:";
});

// Details "Editar" (Figma 2113:2637) hands the brand straight to the edit dialog.
function onDetailsEdit(brand: BrandDto) {
  detailsDialogVisible.value = false;
  onEditRequest(brand);
}

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
    card
    @page="onPage"
    @delete="onDeleteRequest"
    @edit="onEditRequest"
    @details="onDetailsRequest"
    @bulk-delete="onBulkDeleteRequest"
  >
    <template #col-foundedDate="{ data }">
      <span>{{ formatDate(data.foundedDate) }}</span>
    </template>
  </DataTableCommon>

  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    :title="deleteTarget ? `Excluir ${deleteTarget.name}?` : 'Excluir marca?'"
    :message="deleteBlocked ? 'Marca selecionada:' : 'A marca será removida do cadastro:'"
    :items="deleteTarget ? [toDeleteItem(deleteTarget)] : []"
    confirm-label="Excluir marca"
    :confirm-disabled="deleteBlocked"
    :warning="deleteTarget ? blockedWarning(deleteBlocked ? [deleteTarget] : []) : null"
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="onDeleteConfirm"
  />

  <ConfirmDeleteDialog
    v-model:visible="bulkDeleteDialogVisible"
    :title="`Excluir ${brandsLabel(bulkDeleteTargets.length)}?`"
    :message="bulkDeleteMessage"
    :items="bulkDeleteTargets.map(toDeleteItem)"
    :confirm-label="`Excluir ${brandsLabel(bulkDeleteTargets.length)}`"
    :confirm-disabled="bulkDeleteBlockedBrands.length > 0"
    :warning="blockedWarning(bulkDeleteBlockedBrands)"
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

  <DetailsBrandDialog v-model:visible="detailsDialogVisible" :brand="detailsTarget" @edit="onDetailsEdit" />
</template>
