<script setup lang="ts">
import { onMounted, ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import CarsTable from "./CarsTable.vue";
import CreateCarDialog, { type CreateCarPayload } from "./common/dialog/CreateCarDialog.vue";
import Button from "primevue/button";
import { primaryButtonClass } from "../styles/buttonStyles";
import { useCreateEntity } from "../composables/useCreateEntity";
import type { BrandOption } from "../types";
import { Plus } from "@lucide/vue";

const apiUrl = "/api/cars";
const brandsUrl = "/api/brands";

const carsTable = ref<InstanceType<typeof CarsTable> | null>(null);
const brandOptions = ref<BrandOption[]>([]);

async function loadBrandOptions() {
  const response = await fetch(`${brandsUrl}/options`);
  if (response.ok) brandOptions.value = await response.json();
}

const {
  visible: createDialogVisible,
  loading: createLoading,
  error: createError,
  open: openCreate,
  submit: onCreateSubmit,
} = useCreateEntity<CreateCarPayload>({
  apiUrl,
  entityLabel: "car",
  onCreated: () => carsTable.value?.reload(),
});

onMounted(loadBrandOptions);
</script>


<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Cars"
      description="Manage the car inventory: browse model, brand, body type, price, stock and availability, and create, edit or remove entries."
    >
      <template #actions>
        <Button
          :class="primaryButtonClass"
          @click="openCreate"
        >
          <Plus class="text-xs" />
          New car
        </Button>
      </template>
    </PageHeader>

    <CarsTable ref="carsTable" :api-url="apiUrl" :brands="brandOptions" />

    <CreateCarDialog
      v-model:visible="createDialogVisible"
      :brands="brandOptions"
      :loading="createLoading"
      :error="createError"
      @submit="onCreateSubmit"
    />
  </div>
</template>

