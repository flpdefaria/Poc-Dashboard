<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import BrandsTable from "./BrandsTable.vue";
import CreateBrandDialog, { type CreateBrandPayload } from "./common/dialog/CreateBrandDialog.vue";
import Button from "primevue/button";
import { primaryButtonClass } from "../styles/buttonStyles";
import { useCreateEntity } from "../composables/useCreateEntity";
import { Plus } from "@lucide/vue";

const apiUrl = "/api/brands";

const brandsTable = ref<InstanceType<typeof BrandsTable> | null>(null);

const {
  visible: createDialogVisible,
  loading: createLoading,
  error: createError,
  open: openCreate,
  submit: onCreateSubmit,
} = useCreateEntity<CreateBrandPayload>({
  apiUrl,
  entityLabel: "brand",
  onCreated: () => brandsTable.value?.reload(),
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Brands"
      description="Manage the car brands: browse name, country, founding date and number of cars, and create, edit or remove entries."
    >
      <template #actions>
        <Button
          :class="primaryButtonClass"
          @click="openCreate"
        >
          <Plus class="text-xs" />
          New brand
        </Button>
      </template>
    </PageHeader>

    <BrandsTable ref="brandsTable" :api-url="apiUrl" />

    <CreateBrandDialog
      v-model:visible="createDialogVisible"
      :loading="createLoading"
      :error="createError"
      @submit="onCreateSubmit"
    />
  </div>
</template>
