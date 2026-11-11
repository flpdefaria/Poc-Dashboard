<script setup lang="ts">
// Azure Brasil Cloud logo, reproduced from the Figma export as positioned SVG fragments.
const logoParts = [
  { src: "/images/home/logo/group4.svg", left: 7.04, top: 0, width: 17.625, height: 31.971 },
  { src: "/images/home/logo/group5.svg", left: 3.97, top: 8.77, width: 12.962, height: 23.206 },
  { src: "/images/home/logo/group6.svg", left: 0, top: 17.83, width: 9.102, height: 14.018 },
  { src: "/images/home/logo/group3.svg", left: 27.14, top: 12.35, width: 16.521, height: 13.444 },
  { src: "/images/home/logo/vector.svg", left: 0.65, top: 1.85, width: 43.657, height: 30.147 },
  { src: "/images/home/logo/group1.svg", left: 48.82, top: 7.98, width: 42.119, height: 11.253 },
  { src: "/images/home/logo/group2.svg", left: 90.62, top: 7.79, width: 43.363, height: 11.407 },
  { src: "/images/home/logo/group.svg", left: 49.2, top: 23.45, width: 60.929, height: 5.408 },
];
</script>

<template>
  <div class="flex h-14 items-center gap-2 rounded-xl bg-surface-100 px-3">
    <span class="text-[15px] text-surface-700">Desenvolvido por</span>
    <div class="relative h-[34px] w-[136px] shrink-0">
      <img
        v-for="part in logoParts"
        :key="part.src"
        :src="part.src"
        alt=""
        class="absolute"
        :style="{ left: `${part.left}px`, top: `${part.top}px`, width: `${part.width}px`, height: `${part.height}px` }"
      />
    </div>
  </div>
</template>
