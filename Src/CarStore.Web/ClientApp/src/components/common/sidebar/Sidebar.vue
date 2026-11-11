<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import Avatar from "primevue/avatar";
import Tooltip from "primevue/tooltip";
import { useTheme } from "../../../composables/useTheme";
import ThemeSettingsDialog from "../dialog/ThemeSettingsDialog.vue";
import { Building, Car, House, IdCard, Moon, Palette, Sun, User } from "@lucide/vue";

const vTooltip = Tooltip;

// Figma "nav-rail" (file EOvtzuJAvw1UnoH9tsYmiO, node 2005:5267), IconOnly layout: a 72px rail with
// 48px items. Hovering ~300ms expands it to 240px OVER the content (the 72px slot stays in the
// layout), it closes ~300ms after the pointer leaves, and Esc closes it. Keyboard focus never
// expands it: collapsed items show their label as a tooltip on hover and focus instead.

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

const expanded = ref(false);
const HOVER_DELAY = 300;
let hoverTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleExpanded(value: boolean) {
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => (expanded.value = value), HOVER_DELAY);
}

function collapseNow() {
  clearTimeout(hoverTimer);
  expanded.value = false;
}

onBeforeUnmount(() => clearTimeout(hoverTimer));

const tooltipFor = (label: string) => ({ value: label, disabled: expanded.value });

// One row style for links and buttons: a 48px icon cell plus a label that only shows when expanded.
const rowClass =
  "flex h-12 w-full shrink-0 cursor-pointer items-center overflow-hidden rounded-md border-0 bg-transparent p-0 text-sm text-color no-underline transition-colors duration-150 hover:bg-surface-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
// Selected: Figma's blue fill (`--color-navrail-selected`, "Solid" emphasis) with `surface-0` ink, plus a
// stronger label weight so the state does not rely on colour alone.
const selectedRowClass =
  "flex h-12 w-full shrink-0 items-center overflow-hidden rounded-md bg-navrail-selected p-0 text-sm font-semibold text-surface-0 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
</script>

<template>
  <!-- The 72px slot keeps the content in place; the rail itself overlays it when expanded. -->
  <div class="relative h-full w-[72px] shrink-0">
    <aside
      class="absolute inset-y-0 left-0 z-40 flex flex-col gap-2 overflow-hidden bg-surface-50 pb-3 transition-[width] duration-200 ease-in-out motion-reduce:transition-none"
      :class="expanded ? 'w-60 border-r border-surface-200 shadow-lg' : 'w-[72px]'"
      @mouseenter="scheduleExpanded(true)"
      @mouseleave="scheduleExpanded(false)"
      @keydown.esc="collapseNow"
    >
      <!-- Header: 64px, 48px logo linking home. -->
      <div class="flex h-16 shrink-0 items-center px-3">
        <RouterLink
          to="/"
          aria-label="CarStore – início"
          class="flex min-w-0 items-center gap-3 rounded-xl no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <img :src="'/images/sidebar/minicar.gif'" alt="" class="size-12 shrink-0 rounded-xl object-cover" />
          <span v-show="expanded" class="truncate whitespace-nowrap text-lg font-semibold text-color">CarStore</span>
        </RouterLink>
      </div>

      <nav aria-label="Navegação principal" class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          v-tooltip.right="tooltipFor(item.label)"
          :to="item.to"
          :aria-label="item.label"
          :class="item.key === activeKey ? selectedRowClass : rowClass"
        >
          <span class="flex size-12 shrink-0 items-center justify-center">
            <component :is="item.icon" class="size-6" :stroke-width="1.5" />
          </span>
          <span v-show="expanded" class="truncate whitespace-nowrap pr-3">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Footer items: appearance settings (surface mode) and the light/dark icon button, the only theme switch. -->
      <div class="flex shrink-0 flex-col gap-2 px-3">
        <button
          v-tooltip.right="tooltipFor('Aparência')"
          type="button"
          :class="rowClass"
          aria-label="Aparência"
          aria-haspopup="dialog"
          @click="themeSettingsVisible = true"
        >
          <span class="flex size-12 shrink-0 items-center justify-center">
            <Palette class="size-6" :stroke-width="1.5" />
          </span>
          <span v-show="expanded" class="truncate whitespace-nowrap pr-3">Aparência</span>
        </button>

        <button
          v-tooltip.right="tooltipFor('Tema escuro')"
          type="button"
          :class="rowClass"
          aria-label="Tema escuro"
          :aria-pressed="theme === 'dark'"
          @click="toggleTheme"
        >
          <span class="flex size-12 shrink-0 items-center justify-center">
            <component :is="theme === 'dark' ? Sun : Moon" class="size-6" :stroke-width="1.5" />
          </span>
          <span v-show="expanded" class="truncate whitespace-nowrap pr-3">Tema escuro</span>
        </button>
      </div>
      <ThemeSettingsDialog v-model:visible="themeSettingsVisible" />

      <div class="mx-4 h-px shrink-0 bg-surface-200" role="separator"></div>

      <!-- Account: 32px avatar in a 48px slot; name and e-mail only when expanded. -->
      <div class="flex h-12 shrink-0 items-center px-3">
        <span class="flex size-12 shrink-0 items-center justify-center">
          <Avatar shape="circle" class="size-8! bg-surface-200! text-surface-700!" aria-label="Conta">
            <template #icon><User class="size-4" /></template>
          </Avatar>
        </span>
        <div v-show="expanded" class="flex min-w-0 flex-1 flex-col pr-3">
          <p class="truncate whitespace-nowrap text-sm font-semibold text-color">Felipe Faria</p>
          <p class="truncate whitespace-nowrap text-xs text-muted-color">felipe@email.com</p>
        </div>
      </div>
    </aside>
  </div>
</template>
