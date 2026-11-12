<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import Avatar from "primevue/avatar";
import Tooltip from "primevue/tooltip";
import { useTheme } from "../../../composables/useTheme";
import ThemeSettingsDialog from "../dialog/ThemeSettingsDialog.vue";
import { Building, Car, House, IdCard, Moon, Palette, Sun, User } from "@lucide/vue";

const vTooltip = Tooltip;

// Figma "nav-rail" (file EOvtzuJAvw1UnoH9tsYmiO, node 2005:5267), IconOnly layout: a fixed 72px rail
// with 48px icon-only items. It never expands; every item shows its label as a tooltip on hover and focus.

const route = useRoute();

const navItems = [
  { key: "home", label: "Início", icon: House, to: "/" },
  { key: "cars", label: "Carros", icon: Car, to: "/cars" },
  { key: "brands", label: "Marcas", icon: Building, to: "/brands" },
  { key: "customers", label: "Clientes", icon: IdCard, to: "/customers" },
];

const activeKey = computed(() => route.name as string);

const { theme, toggle: toggleTheme } = useTheme();
const themeSettingsVisible = ref(false);

// One 48px square icon cell style for links and buttons.
const rowClass =
  "icon-motion flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-color no-underline transition-colors duration-150 hover:bg-surface-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
// Selected: Figma's blue fill (`--color-navrail-selected`, "Solid" emphasis) with `surface-0` ink.
const selectedRowClass =
  "icon-motion flex size-12 shrink-0 items-center justify-center rounded-md bg-navrail-selected p-0 text-surface-0 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
</script>

<template>
  <aside class="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 bg-surface-50 pb-3">
    <!-- Header: 64px, 48px logo linking home. -->
    <div class="flex h-16 shrink-0 items-center">
      <RouterLink
        v-tooltip.right="'CarStore'"
        to="/"
        aria-label="CarStore – início"
        class="flex rounded-xl no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <img :src="'/images/sidebar/minicar.gif'" alt="" class="size-12 shrink-0 rounded-xl object-cover" />
      </RouterLink>
    </div>

    <nav aria-label="Navegação principal" class="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden px-3 py-0.5">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        v-tooltip.right="item.label"
        :to="item.to"
        :aria-label="item.label"
        :aria-current="item.key === activeKey ? 'page' : undefined"
        :class="item.key === activeKey ? selectedRowClass : rowClass"
      >
        <component :is="item.icon" class="size-6" :stroke-width="1.5" />
      </RouterLink>
    </nav>

    <!-- Footer items: appearance settings (surface mode) and the light/dark icon button, the only theme switch. -->
    <div class="flex shrink-0 flex-col items-center gap-2">
      <button
        v-tooltip.right="'Aparência'"
        type="button"
        :class="rowClass"
        aria-label="Aparência"
        aria-haspopup="dialog"
        @click="themeSettingsVisible = true"
      >
        <Palette class="size-6" :stroke-width="1.5" />
      </button>

      <button
        v-tooltip.right="'Tema escuro'"
        type="button"
        :class="rowClass"
        aria-label="Tema escuro"
        :aria-pressed="theme === 'dark'"
        @click="toggleTheme"
      >
        <component :is="theme === 'dark' ? Sun : Moon" class="size-6" :stroke-width="1.5" />
      </button>
    </div>
    <ThemeSettingsDialog v-model:visible="themeSettingsVisible" />

    <div class="h-px w-10 shrink-0 bg-surface-200" role="separator"></div>

    <!-- Account: 32px avatar in a 48px slot. -->
    <span v-tooltip.right="'Felipe Faria'" class="flex size-12 shrink-0 items-center justify-center">
      <Avatar shape="circle" class="size-8! bg-surface-200! text-surface-700!" aria-label="Conta">
        <template #icon><User class="size-4" /></template>
      </Avatar>
    </span>
  </aside>
</template>
