import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { flagRows, playRowExit } from "../utils/rowEffects";
import { capitalize, genderSuffix, requestFailedMessage, type EntityLabel } from "../utils/entityLabel";

interface UseEntityCrudOptions {
  /** Base REST endpoint for the entity, e.g. "/api/cars". */
  apiUrl: string;
  /** pt-BR noun (with gender/plural) used in toasts and fallback error messages, e.g. `carLabel`. */
  entityLabel: EntityLabel;
  /** Reloads the current page of the table after a successful delete/edit. */
  reload: () => Promise<void> | void;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.message ?? requestFailedMessage(response.status);
}

/**
 * Shared delete/edit/details row-action state machine used by the entity DataTables
 * (CarsTable, BrandsTable, ...). Encapsulates the dialog visibility, target row,
 * loading/error state and fetch calls that were previously duplicated per table.
 */
export function useEntityCrud<TEntity extends { id: number }, TEditPayload>(
  options: UseEntityCrudOptions,
) {
  const { apiUrl, entityLabel, reload } = options;
  const toast = useToast();
  const o = genderSuffix(entityLabel);
  const os = genderSuffix(entityLabel, true);

  const deleteDialogVisible = ref(false);
  const deleteTarget = ref<TEntity | null>(null);
  const deleteLoading = ref(false);
  const deleteError = ref<string | null>(null);

  function onDeleteRequest(data: TEntity) {
    deleteTarget.value = data;
    deleteError.value = null;
    deleteDialogVisible.value = true;
  }

  async function onDeleteConfirm() {
    if (!deleteTarget.value) return;
    deleteLoading.value = true;
    deleteError.value = null;
    try {
      const response = await fetch(`${apiUrl}/${deleteTarget.value.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await parseErrorMessage(response));
      deleteDialogVisible.value = false;
      toast.add({
        severity: "success",
        summary: `${capitalize(entityLabel.singular)} excluíd${o}`,
        life: 3000,
      });
      await playRowExit(apiUrl, [deleteTarget.value.id]);
      await reload();
    } catch (err) {
      deleteError.value = err instanceof Error ? err.message : `Não foi possível excluir ${o} ${entityLabel.singular}.`;
    } finally {
      deleteLoading.value = false;
    }
  }

  const bulkDeleteDialogVisible = ref(false);
  const bulkDeleteTargets = ref<TEntity[]>([]);
  const bulkDeleteLoading = ref(false);
  const bulkDeleteError = ref<string | null>(null);

  function onBulkDeleteRequest(items: TEntity[]) {
    if (!items.length) return;
    bulkDeleteTargets.value = items;
    bulkDeleteError.value = null;
    bulkDeleteDialogVisible.value = true;
  }

  async function onBulkDeleteConfirm() {
    if (!bulkDeleteTargets.value.length) return;
    bulkDeleteLoading.value = true;
    bulkDeleteError.value = null;
    const targets = bulkDeleteTargets.value;
    const results = await Promise.all(
      targets.map(async (item) => {
        const response = await fetch(`${apiUrl}/${item.id}`, { method: "DELETE" });
        return response.ok;
      }),
    );
    const failedCount = results.filter((ok) => !ok).length;
    bulkDeleteLoading.value = false;
    const deletedIds = targets.filter((_, i) => results[i]).map((item) => item.id);
    if (failedCount > 0) {
      bulkDeleteError.value =
        failedCount === targets.length
          ? `Não foi possível excluir ${os} ${entityLabel.plural} selecionad${os}.`
          : `${failedCount} de ${targets.length} ${entityLabel.plural} não puderam ser excluíd${os}.`;
      if (deletedIds.length) await playRowExit(apiUrl, deletedIds);
      await reload();
      return;
    }
    bulkDeleteDialogVisible.value = false;
    toast.add({
      severity: "success",
      summary:
        targets.length === 1
          ? `1 ${entityLabel.singular} excluíd${o}`
          : `${targets.length} ${entityLabel.plural} excluíd${os}`,
      life: 3000,
    });
    await playRowExit(apiUrl, deletedIds);
    await reload();
  }

  const editDialogVisible = ref(false);
  const editTarget = ref<TEntity | null>(null);
  const editLoading = ref(false);
  const editError = ref<string | null>(null);

  function onEditRequest(data: TEntity) {
    editTarget.value = data;
    editError.value = null;
    editDialogVisible.value = true;
  }

  async function onEditSubmit(payload: TEditPayload) {
    if (!editTarget.value) return;
    editLoading.value = true;
    editError.value = null;
    try {
      const response = await fetch(`${apiUrl}/${editTarget.value.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await parseErrorMessage(response));
      editDialogVisible.value = false;
      toast.add({
        severity: "success",
        summary: `${capitalize(entityLabel.singular)} atualizad${o}`,
        life: 3000,
      });
      await reload();
      flagRows(apiUrl, [editTarget.value.id], "updated", 2000);
    } catch (err) {
      editError.value = err instanceof Error ? err.message : `Não foi possível atualizar ${o} ${entityLabel.singular}.`;
    } finally {
      editLoading.value = false;
    }
  }

  const detailsDialogVisible = ref(false);
  const detailsTarget = ref<TEntity | null>(null);

  function onDetailsRequest(data: TEntity) {
    detailsTarget.value = data;
    detailsDialogVisible.value = true;
  }

  return {
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
  };
}
