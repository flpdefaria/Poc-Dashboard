<script setup lang="ts">
// Figma "trash" glyph (Cars row menu 2069:3601, bulk button 2070:1925, delete-dialog 2072:2729): Lucide trash-2
// without the two inner lines (`M10 11v6`, `M14 11v6`). No Lucide icon draws it (in @lucide/vue `Trash` is an alias
// of `Trash2`), so it is built on Lucide's own `Icon` and keeps the Lucide API (`size`, `strokeWidth`,
// `absoluteStrokeWidth`, `class`) and the `.lucide` sizing rule. Used by the Cars (card / list-mode) paths only.
import { Icon } from "@lucide/vue";

withDefaults(
  defineProps<{
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }>(),
  { size: undefined, strokeWidth: undefined, absoluteStrokeWidth: false },
);

const trashNode: [string, Record<string, string>][] = [
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "trash-body" }],
  ["path", { d: "M3 6h18", key: "trash-rim" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "trash-lid" }],
];
</script>

<template>
  <Icon
    name="trash"
    :icon-node="trashNode"
    :size="size as number | undefined"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="absoluteStrokeWidth"
  />
</template>
