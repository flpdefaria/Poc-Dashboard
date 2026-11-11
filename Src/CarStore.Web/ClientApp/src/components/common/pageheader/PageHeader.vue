<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <!-- Figma page-header title-row (component 2005:3655, Cars I2063:7;363:2790): heading block (24/32 title,
       4px gap, 14/20 muted description) beside the actions, vertically centered, 8px apart. -->
  <div class="flex w-full items-center gap-2">
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <h1 class="text-2xl font-semibold text-color">{{ title }}</h1>
      <p v-if="description" class="text-sm text-muted-color">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center justify-end gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
