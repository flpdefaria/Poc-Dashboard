<script setup lang="ts">
defineProps<{
  label: string;
  /** `id` of the control in the slot, so the label is bound to it (`for`). */
  inputId?: string;
  /** Figma form-dialog field (Cars 2075:4919): `label/md` 12px/16px medium label, 8px gap. */
  compact?: boolean;
}>();
</script>

<template>
  <div class="flex w-full min-w-0 flex-1 flex-col" :class="compact ? 'gap-2' : 'gap-1.75'">
    <label
      :for="inputId"
      class="w-full text-color"
      :class="compact ? 'text-xs leading-4 font-medium' : 'text-sm'"
    >{{ label }}</label>
    <slot />
  </div>
</template>
