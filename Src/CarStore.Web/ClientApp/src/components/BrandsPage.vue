<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import BrandsTable from "./BrandsTable.vue";
import CreateBrandDialog, { type CreateBrandPayload } from "./common/dialog/CreateBrandDialog.vue";
import Button from "primevue/button";
import { primaryButtonClass } from "../styles/buttonStyles";
import { useCreateEntity } from "../composables/useCreateEntity";
import { brandLabel } from "../utils/entityLabel";
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
  entityLabel: brandLabel,
  onCreated: () => brandsTable.value?.reload(),
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Marcas"
      description="Gerencie as marcas de carros: consulte nome, país, data de fundação e número de carros, e crie, edite ou remova registros."
    >
      <template #actions>
        <Button
          :class="primaryButtonClass"
          @click="openCreate"
        >
          <Plus class="text-xs" />
          Nova marca
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
