<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Avatar from "primevue/avatar";
import { useTheme } from "../../../composables/useTheme";
import ThemeSettingsDialog from "../dialog/ThemeSettingsDialog.vue";
import { Building2, Car, House, IdCard, Moon, Palette, Sun, User } from "@lucide/vue";

const route = useRoute();

const navItems = [
  { key: "home", label: "Home", icon: House, to: "/" },
  { key: "cars", label: "Cars", icon: Car, to: "/cars" },
  { key: "brands", label: "Brands", icon: Building2, to: "/brands" },
  { key: "customers", label: "Customers", icon: IdCard, to: "/customers" },
];

const activeKey = computed(() => route.name as string);

const { theme, toggle: toggleTheme } = useTheme();
const themeSettingsVisible = ref(false);

// collapsed by default; hovering the rail expands it back to the full layout
const expanded = ref(false);
</script>

<template>
  <aside
    class="flex h-full shrink-0 flex-col gap-1.75 overflow-hidden rounded-xl bg-surface-100 px-[17.5px] py-[17.5px] transition-[width] duration-200 ease-in-out"
    :class="expanded ? 'w-[278px]' : 'w-[78px]'"
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
  >
    <div class="flex h-10 w-full items-center gap-1.75 overflow-hidden py-[17.5px]">
      <div class="size-10 shrink-0 overflow-hidden rounded-xl">
        <img :src="'/images/sidebar/minicar.gif'" alt="CarStore" class="size-full object-cover" />
      </div>
      <div v-show="expanded" class="flex min-w-0 flex-1 flex-col">
        <p class="truncate whitespace-nowrap text-[22px] font-black leading-none text-surface-700">CarStore</p>
        <p class="truncate whitespace-nowrap text-xs text-muted-color">Premium dealership</p>
      </div>
    </div>

    <nav class="flex w-full flex-col gap-3 py-[17.5px]">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="flex h-10 w-full items-center gap-1.75 overflow-hidden rounded-lg py-[10.5px] pl-[14.5px] pr-[10.5px] text-sm font-medium no-underline"
        :class="item.key === activeKey ? 'bg-surface-800 text-surface-0' : 'bg-surface-100 text-color hover:bg-surface-50'"
      >
        <component :is="item.icon" class="text-sm" />
        <span v-show="expanded" class="truncate whitespace-nowrap">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="flex-1"></div>

    <!-- Appearance (theme + surface mode, Atlas-style settings dialog): same nav-row styling as the switch below. -->
    <button
      type="button"
      class="flex h-10 w-full shrink-0 cursor-pointer items-center gap-1.75 overflow-hidden rounded-lg border-0 bg-transparent py-[10.5px] pl-[14.5px] pr-[10.5px] text-sm font-medium text-color transition-colors duration-150 hover:bg-surface-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Appearance"
      aria-haspopup="dialog"
      @click="themeSettingsVisible = true"
    >
      <Palette class="text-sm" />
      <span v-show="expanded" class="truncate whitespace-nowrap">Appearance</span>
    </button>
    <ThemeSettingsDialog v-model:visible="themeSettingsVisible" />

    <!-- Theme switch: styled as a nav row so it reads as part of the rail, not a floating control. -->
    <button
      type="button"
      class="flex h-10 w-full shrink-0 cursor-pointer items-center gap-1.75 overflow-hidden rounded-lg border-0 bg-transparent py-[10.5px] pl-[14.5px] pr-[10.5px] text-sm font-medium text-color transition-colors duration-150 hover:bg-surface-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Dark theme"
      :aria-pressed="theme === 'dark'"
      @click="toggleTheme"
    >
      <component :is="theme === 'dark' ? Sun : Moon" class="text-sm" />
      <span v-show="expanded" class="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span class="truncate whitespace-nowrap">Dark theme</span>
        <!-- Switch track mirrors aria-pressed for sighted users. -->
        <span
          class="relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200"
          :class="theme === 'dark' ? 'bg-surface-700' : 'bg-surface-300'"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 left-0.5 size-3 rounded-full bg-surface-0 transition-transform duration-200"
            :class="theme === 'dark' ? 'translate-x-3' : ''"
          ></span>
        </span>
      </span>
    </button>

    <div
      class="flex h-19 w-full items-center gap-1.75 overflow-hidden rounded-xl p-[17.5px]"
      :class="expanded ? 'justify-start border border-surface-300 bg-surface-50' : 'justify-center'"
    >
      <Avatar
        shape="circle"
        class="shrink-0 bg-surface-300! text-surface-700!"
        :class="expanded ? 'size-10' : 'size-[35px]'"
      >
        <template #icon><User /></template>
      </Avatar>
      <div v-show="expanded" class="flex min-w-0 flex-1 flex-col">
        <p class="truncate whitespace-nowrap text-sm font-semibold text-color">Felipe Faria</p>
        <p class="truncate whitespace-nowrap text-xs text-muted-color">felipe@email.com</p>
      </div>
    </div>
  </aside>
</template>

