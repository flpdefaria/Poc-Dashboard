import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { flagRows } from "../utils/rowEffects";
import { capitalize, genderSuffix, requestFailedMessage, type EntityLabel } from "../utils/entityLabel";

interface UseCreateEntityOptions {
  /** REST endpoint to POST the new entity to, e.g. "/api/cars". */
  apiUrl: string;
  /** pt-BR noun (with gender) used in the toast and fallback error message, e.g. `carLabel`. */
  entityLabel: EntityLabel;
  /** Called after a successful create, typically to reload the table. */
  onCreated: () => Promise<void> | void;
}

/**
 * Shared "create entity" dialog state machine used by the entity pages
 * (CarsPage, BrandsPage, ...). Encapsulates dialog visibility, loading/error
 * state and the POST fetch call that were previously duplicated per page.
 */
export function useCreateEntity<TPayload>(options: UseCreateEntityOptions) {
  const toast = useToast();
  const visible = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function open() {
    error.value = null;
    visible.value = true;
  }

  async function submit(payload: TPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(options.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? requestFailedMessage(response.status));
      }
      const created = await response.json().catch(() => null);
      visible.value = false;
      toast.add({
        severity: "success",
        summary: `${capitalize(options.entityLabel.singular)} criad${genderSuffix(options.entityLabel)}`,
        life: 3000,
      });
      await options.onCreated();
      if (created?.id != null) flagRows(options.apiUrl, [created.id], "created", 2400);
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Não foi possível criar ${genderSuffix(options.entityLabel)} ${options.entityLabel.singular}.`;
    } finally {
      loading.value = false;
    }
  }

  return { visible, loading, error, open, submit };
}
