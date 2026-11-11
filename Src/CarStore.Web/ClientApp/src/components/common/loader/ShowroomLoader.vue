<script setup lang="ts">
import { computed, toRef } from "vue";
import { useTweenedNumber } from "../../../composables/useTweenedNumber";

const props = defineProps<{
  /** 0-100: share of the startup requests that have finished. */
  progress: number;
}>();

// The bar and the car glide between steps instead of snapping as each request lands.
const shown = useTweenedNumber(toRef(props, "progress"), 450);
const percent = computed(() => Math.round(shown.value));
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface-0">
    <div class="flex w-[min(360px,80vw)] flex-col gap-6">
      <p class="text-[22px] font-black leading-none text-surface-700">CarStore</p>

      <div
        role="progressbar"
        aria-label="Carregando dados da frota"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="percent"
        class="relative pt-12"
      >
        <!-- The sidebar's logo car drives along the track as the data arrives. -->
        <div
          class="loader-car absolute top-0 size-10 overflow-hidden rounded-xl"
          :style="{ left: `${shown}%`, translate: `-${shown}% 0` }"
        >
          <img :src="'/images/sidebar/minicar.gif'" alt="" class="size-full object-cover" />
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
          <div class="h-full w-full origin-left rounded-full bg-surface-700" :style="{ transform: `scaleX(${shown / 100})` }"></div>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-color">Carregando dados da frota</span>
        <span class="font-semibold tabular-nums text-color">{{ percent }}%</span>
      </div>
    </div>
  </div>
</template>
