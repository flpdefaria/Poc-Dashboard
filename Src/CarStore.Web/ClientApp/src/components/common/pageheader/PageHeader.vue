<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex w-full flex-col gap-1">
    <h1 class="text-2xl font-semibold text-color">{{ title }}</h1>
    <div class="flex items-start justify-between gap-4">
      <p v-if="description" class="text-sm text-muted-color">{{ description }}</p>
      <div class="flex shrink-0 justify-end">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
