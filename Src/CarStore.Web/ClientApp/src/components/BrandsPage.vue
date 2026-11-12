<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import BrandsTable from "./BrandsTable.vue";
import CreateBrandDialog, { type CreateBrandPayload } from "./common/dialog/CreateBrandDialog.vue";
import Button from "primevue/button";
import { primaryButtonMdClass } from "../styles/buttonStyles";
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
  <!-- Figma "Tela · Marcas" main (2113:6): 24px between the page header and the content. -->
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Marcas"
      description="Gerencie as marcas de carros: consulte nome, país, data de fundação e número de carros, e crie, edite ou remova registros."
    >
      <template #actions>
        <Button label="Nova marca" :class="primaryButtonMdClass" @click="openCreate">
          <template #icon><Plus /></template>
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
