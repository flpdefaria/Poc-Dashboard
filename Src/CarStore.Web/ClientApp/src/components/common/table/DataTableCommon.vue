<script setup lang="ts">
import { computed, markRaw, ref, watch, type Component } from "vue";
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from "primevue/datatable";
import Column from "primevue/column";
import Menu from "primevue/menu";
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import { rowEffectClass } from "../../../utils/rowEffects";
import TrashIcon from "../icons/TrashIcon.vue";
import { ArrowDown, ArrowUp, ArrowUpDown, EllipsisVertical, Eye, Pencil, Search, Trash2 } from "@lucide/vue";

export interface DataTableColumn {
  field: string;
  header: string;
  /** Emphasized styling for the row's primary/identifying column (e.g. Title, Name). */
  primary?: boolean;
  /** Current-page sorting on this column; defaults to true. */
  sortable?: boolean;
  /** Fixed column width (any CSS length, e.g. "36.4%"). With `flush` the table uses a fixed layout. */
  width?: string;
}

// `lucideIcon` (not PrimeVue's string `icon`) is rendered through the Menu's #itemicon slot.
type MenuItem = { label?: string; lucideIcon?: Component; command?: () => void };

// Matches Figma "modal action" popup (node 39:22030): white panel, 12px radius, 4/8px list padding, 2px item gap.
const menuPt = {
  root: { class: "min-w-[140px] rounded-xl border border-surface-300 bg-surface-0 p-0" },
  list: { class: "flex flex-col gap-0.5 px-1 py-2" },
  itemLink: { class: "icon-motion gap-1.75 rounded-md px-[10.5px] py-[7px] text-sm font-normal text-color" },
  itemIcon: { class: "text-sm" },
};

// Matches Figma "paginator" component (node 8:7279): flat, borderless nav buttons, no filled
// highlight on the active page (just bolder text), plain-bordered rows-per-page select.
// `!` overrides are required because PrimeVue's runtime style tag is injected after Tailwind's,
// so equal-specificity utility classes would otherwise lose to the theme's default page/button colors.
const navButtonPt = { class: "h-[35px] w-[35px] rounded-full bg-transparent! text-muted-color hover:bg-surface-100! hover:text-color!" };
const paginatorPt = {
  root: { class: "justify-end gap-[3.5px] rounded-none bg-transparent! px-3.5 py-1.75" },
  first: navButtonPt,
  prev: navButtonPt,
  next: navButtonPt,
  last: navButtonPt,
  page: ({ context }: { context: { active: boolean } }) => ({
    class: [
      "h-[35px] w-[35px] rounded-full bg-transparent! text-sm hover:bg-surface-100!",
      context.active ? "font-semibold text-color!" : "font-normal text-muted-color!",
    ],
  }),
  pcRowPerPageDropdown: {
    root: { class: "rounded-md border border-surface-300 bg-surface-0" },
  },
};

// `flush` rows follow the Figma table component (dashboard node 2009:212): 40px rows INCLUDING the 1px bottom
// border (20px text + 9.5px above/below + 1px), 14px cell inset, and cell content truncated with an ellipsis.
// `!` is needed because PrimeVue's `.p-datatable-tbody > tr > td` padding outranks a utility class.
// Header content spans the cell with the title growing, so the sort icon sits at the right edge 8px after
// it (Figma table-header-cell, node I2009:212;553:9757;2009:414;553:987;2009:409).
const flushColumnPt = {
  headerCell: { class: "icon-motion px-3.5! py-[9.5px]!" },
  bodyCell: { class: "truncate px-3.5! py-[9.5px]!" },
  columnHeaderContent: { class: "w-full gap-2!" },
  columnTitle: { class: "min-w-0 flex-1 truncate" },
};

// `flush` search box = Figma "inputtext" sm (node I2009:212;553:9756;2009:398, inside 2037:268): 216x32,
// 1px border (`#a3a3a3` -> surface-400) with radius 6, 12px search icon 13px from the left edge, text
// 12px/18px starting 33.75px from the edge (12px icon + 8.75px gap). Figma strokes sit inside the frame, so
// the CSS (border-box) padding is the Figma offset minus the 1px border. The shadow is Aura's default.
// `!` beats PrimeVue's `.p-iconfield .p-inputicon:first-child` / `.p-iconfield .p-inputtext` rules.
const flushSearchIconClass = "start-[13px]! size-3! -mt-1.5! text-xs!";
const flushSearchInputClass =
  "h-8! rounded-md! py-0! ps-[32.75px]! pe-3! text-xs! leading-[18px]! not-focus:border-surface-400!";

// `card` = Figma Cars table (frame 2063:4, card 2064:7106, density Large): 48px header and body rows INCLUDING the
// 1px bottom border, 18px cell inset, 14px text-color body. Text cells: 20px line + 2 x 13.5px + 1px = 48px; the
// row grows to the tallest cell, so the 32px actions button gets its own 7.5px inset (column below).
const cardColumnPt = {
  headerCell: { class: "icon-motion px-[18px]! py-[13.5px]!" },
  bodyCell: { class: "truncate px-[18px]! py-[13.5px]!" },
  columnHeaderContent: { class: "w-full gap-2!" },
  columnTitle: { class: "min-w-0 flex-1 truncate font-semibold" },
};
const cardSelectionColumnPt = {
  headerCell: { class: "px-[18px]! py-[13.5px]!" },
  bodyCell: { class: "px-[18px]! py-[13.5px]!" },
};
const cardActionsColumnPt = {
  headerCell: { class: "px-[18px]! py-[13.5px]! text-left!" },
  bodyCell: { class: "px-[18px]! py-[7.5px]!" },
  columnTitle: { class: "font-semibold" },
};

// Selected row (Figma table-row Selected, 2070:1090): Figma's blue pair #d7e6fe / #1046a0, exactly, through
// the `selected` / `selected-ink` theme tokens in style.css (lifted for dark theme). The checked checkbox
// (#2564cf) is styled in style.css under `.dt-card`. `!` beats `.p-datatable-row-selected`.
const cardBodyRowPt = ({ context }: { context: { selected: boolean } }) => ({
  class: context.selected ? "bg-selected! text-selected-ink!" : undefined,
});

// Figma paginator inside the card footer (I2069:2766;553:9905;2069:3083): centered, 4px gap, 14px x 6px padding
// inside an 8px footer inset (so 14px top/bottom: 14 + 40px select + 14 = 68px footer), 36px round nav buttons,
// no bottom border (the card border closes it). Nav glyphs are the PrimeOne angle icons, which are PrimeVue's own
// built-in paginator SVGs, drawn at 14px (Aura renders `.p-icon` at 1rem). Page numbers are 14px regular muted;
// the current page is 14px semibold on the selected fill. The Figma blue pair (#d7e6fe / #1046a0) maps to the
// Prometheus soft tokens, as for the selected row. Hover only applies to idle pages (Aura's rule also skips the
// selected one); disabled first/prev/next/last keep Aura's 0.6 opacity (Figma draws no disabled state).
// `!` is required on every size and colour: `.p-paginator` padding, the nav buttons' `min-width`/`height` and the
// selected-page colours come from PrimeVue CSS injected outside Tailwind's layers.
const cardNavButtonPt = { class: "size-9! min-w-9! rounded-full bg-transparent! text-muted-color hover:bg-surface-100! hover:text-color!" };
const cardNavIconPt = { class: "size-3.5!" };
const cardPaginatorPt = {
  // The outer <nav> gets DataTable's `.p-datatable-paginator-bottom` (1px bottom border); the card already has one.
  paginatorContainer: { class: "border-0!" },
  root: { class: "justify-center gap-1! rounded-none border-0! bg-transparent! px-3.5! py-3.5!" },
  first: cardNavButtonPt,
  firstIcon: cardNavIconPt,
  prev: cardNavButtonPt,
  prevIcon: cardNavIconPt,
  next: cardNavButtonPt,
  nextIcon: cardNavIconPt,
  last: cardNavButtonPt,
  lastIcon: cardNavIconPt,
  page: ({ context }: { context: { active: boolean } }) => ({
    class: [
      "size-9! min-w-9! rounded-full text-sm",
      context.active
        ? "bg-selected! font-semibold text-selected-ink!"
        : "bg-transparent! font-normal text-muted-color! hover:bg-surface-100! hover:text-color!",
    ],
  }),
  // Figma "select" (…;394:18797): 40px, surface-400 border, 16px label inset, 14px/1.5 value in the muted
  // select colour (#6b7280), 40px dropdown with a 14px muted chevron (Aura's width matches; its chevron colour is
  // surface-400, so it is forced to muted).
  pcRowPerPageDropdown: {
    root: { class: "h-10 rounded-md not-[.p-focus]:border-surface-400!" },
    // 38px line = 40px - 2 x 1px border: centers the label, which `.p-select-label { display: block }` keeps from flexing.
    label: { class: "px-4! py-0! text-sm! leading-[38px]! text-muted-color!" },
    dropdownIcon: { class: "size-3.5! text-muted-color!" },
  },
};

// Figma "menu" (Cars 2069:3601, refreshed): 175px, 6px radius, surface-200 border, menu shadow (= shadow-md),
// 4px list padding, 4px item gap, 30px items (14px text, leading 1, 8px x 12px padding, 4px radius, 8px icon gap),
// 14px icons in #6b7280 (muted; Aura's menu icon is surface-400) with Figma's 1.5px icon stroke. Every item,
// "Excluir" included, uses the plain menu ink (#1f2937 -> text-color): no destructive colour, no separators.
// 1 + 3 + 3 x 30 + 2 x 4 + 3 + 1 = 106px tall (Figma's stroke sits outside the auto layout, so list padding is
// 3px). Hover/focus is not drawn in Figma and keeps Aura's surface-100 item focus fill.
// `!` beats `.p-menu { min-width: 12.5rem }`, `.p-menu-item-link` padding and `.p-menu-item-icon` color
// (PrimeVue CSS is unlayered). The #itemicon slot only receives cx('itemIcon'), so `itemIcon` is applied by the
// template, not by PrimeVue's pt.
const cardMenuPt = {
  root: { class: "min-w-[175px]! rounded-md! border border-surface-200 bg-surface-0 p-0 shadow-md" },
  list: { class: "flex flex-col gap-1! p-[3px]!" },
  itemLink: { class: "icon-motion gap-2! rounded-sm px-3! py-2! text-sm leading-none font-normal text-color" },
  itemIcon: { class: "size-3.5! text-sm text-muted-color!" },
};
// Figma places the menu 4px under the trigger with its right edge on the trigger's right edge (menu x 1194..1369,
// button 1337..1369). PrimeVue aligns popups to the trigger's left edge with a 2px gutter, so card mode realigns it.
const cardMenuGap = 4;

// Trigger while its menu is open (Figma row I2069:2766;553:9904;2069:2779): the row keeps the hover fill and the
// button shows the text-secondary hover fill (#f9fafb -> surface-50) with the #111827 (surface-900) glyph.
const cardMenuTriggerClass =
  "size-8! rounded-md! p-0! text-surface-900! hover:bg-surface-50! [&_.lucide]:size-4!";
const cardMenuOpenRowClass = "bg-(--p-datatable-row-hover-background)!";

// Figma search "inputtext" above the card (2066:561): 216x40, 14px icon 17px from the edge, text 41.5px from
// the edge (14px icon + 10.5px gap); CSS padding = Figma offset minus the 1px border. Border #9ca3af -> surface-400
// (Aura's default is surface-300), dropped while focused so the focus color still shows.
// Icon (content 2066:560 re-read): `iconfield/icon/color` #6b7280 -> text-muted-color (Aura's
// `--p-iconfield-icon-color` is surface-400, so `!`), drawn with the 1.5px `--p-icon-stroke-width` at 14px.
const cardSearchIconClass = "start-[17px]! size-3.5! -mt-[7px]! text-sm! text-muted-color!";
const cardSearchIconProps = { size: 14, strokeWidth: 1.5, absoluteStrokeWidth: true };
const cardSearchInputClass = "h-10! py-0! ps-[40.5px]! pe-4! text-sm! leading-[21px]! not-focus:border-surface-400!";

// Figma "Excluir selecionados (N)" (2070:1925): 40px outlined danger button, `button/outlined/danger/color` #b91c1c
// -> `--p-red-700` (PrimeVue palette var; Tailwind v4's oklch reds do not match), lifted to `--p-red-300` on the dark
// canvas. The #fecaca border is Aura's outlined danger border already. `!` beats `.p-button-outlined.p-button-danger`.
const cardBulkButtonClass =
  "h-10! gap-2! rounded-md! px-4! py-0! text-sm! leading-[21px]! font-medium! text-(--p-red-700)! [html.app-dark_&]:text-(--p-red-300)! [&_.lucide]:size-4!";

const props = withDefaults(
  defineProps<{
    value: any[];
    columns: DataTableColumn[];
    loading?: boolean;
    totalRecords?: number;
    first?: number;
    rows?: number;
    rowsPerPageOptions?: number[];
    dataKey?: string;
    detailsUrl?: string;
    editUrl?: string;
    deleteUrl?: string;
    /** When true, the Delete action emits a `delete` event instead of navigating to deleteUrl. */
    confirmDelete?: boolean;
    /** When true, the Edit action emits an `edit` event instead of navigating to editUrl. */
    confirmEdit?: boolean;
    /** When true, the Details action emits a `details` event instead of navigating to detailsUrl. */
    confirmDetails?: boolean;
    /** When true, shows row checkboxes and a "Delete selected" action that emits `bulk-delete`. */
    bulkDelete?: boolean;
    /** The entity's API url: rows flagged under it by the CRUD composables play their create/edit/delete effect. */
    effectScope?: string;
    /** Placeholder of the current-page search box. */
    searchPlaceholder?: string;
    /** Set false for a fixed-size preview (e.g. a dashboard panel) that links to the full list instead. */
    paginator?: boolean;
    /** Alternate row backgrounds. */
    stripedRows?: boolean;
    /** Edge-to-edge variant for a table that is itself the card body: no outer border, padded toolbar, 40px rows. */
    flush?: boolean;
    /**
     * Figma Cars table (2064:7106): search box above a 12px-radius bordered card with a light shadow, 48px rows,
     * 56px checkbox and 80px actions columns, equal data columns (fixed layout), centered paginator, tinted
     * selected rows and the 175px row menu. Do not combine with `flush`.
     */
    card?: boolean;
  }>(),
  {
    rowsPerPageOptions: () => [10, 20, 50],
    searchPlaceholder: "Buscar nesta página…",
    paginator: true,
    dataKey: "id",
    rows: 10,
    first: 0,
  },
);

const emit = defineEmits<{
  page: [event: DataTablePageEvent];
  delete: [data: any];
  edit: [data: any];
  details: [data: any];
  "bulk-delete": [data: any[]];
}>();

// Search and sort operate only on the currently loaded page: pagination is
// server-side (lazy), so there is no full dataset on the client to search/sort.
const searchTerm = ref("");
const sortField = ref<string | null>(null);
const sortOrder = ref<1 | -1 | null>(null);

const displayValue = computed(() => {
  let rows = props.value;

  const term = searchTerm.value.trim().toLowerCase();
  if (term) {
    rows = rows.filter((row) =>
      props.columns.some((col) => String(row[col.field] ?? "").toLowerCase().includes(term)),
    );
  }

  if (sortField.value) {
    const field = sortField.value;
    const order = sortOrder.value ?? 1;
    rows = [...rows].sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      if (va == null && vb == null) return 0;
      if (va == null) return -1 * order;
      if (vb == null) return 1 * order;
      if (va < vb) return -1 * order;
      if (va > vb) return 1 * order;
      return 0;
    });
  }

  return rows;
});

function onSort(event: DataTableSortEvent) {
  sortField.value = (event.sortField as string) ?? null;
  sortOrder.value = event.sortOrder === -1 ? -1 : 1;
}

const selectedRows = ref<any[]>([]);

// Selected rows may not exist on a different page once the value array changes
// (page turn, reload after a mutation), so stale selections are dropped.
watch(
  () => props.value,
  () => {
    selectedRows.value = [];
  },
);

function onBulkDeleteClick() {
  emit("bulk-delete", selectedRows.value);
  selectedRows.value = [];
}

const hasActions = !!(
  props.detailsUrl ||
  props.confirmDetails ||
  props.editUrl ||
  props.confirmEdit ||
  props.deleteUrl ||
  props.confirmDelete
);

const menu = ref();
const menuItems = ref<MenuItem[]>([]);
// Row whose actions menu is open, and its trigger: card mode keeps both in their open state (Figma 2069:2759).
const menuRowKey = ref<unknown>(null);
let menuTrigger: HTMLElement | null = null;

function rowClass(row: any) {
  const effect = rowEffectClass(props.effectScope, row[props.dataKey]);
  const key = row[props.dataKey];
  const menuOpen =
    props.card &&
    menuRowKey.value != null &&
    menuRowKey.value === key &&
    !selectedRows.value.some((selected) => selected[props.dataKey] === key); // selection dominates hover
  return menuOpen ? [effect, cardMenuOpenRowClass] : effect;
}

// Runs after PrimeVue's own `absolutePosition` (Menu emits `show` at the end of onEnter). Keeps PrimeVue's
// vertical flip and only swaps the horizontal anchor and the gap. The flip is read from geometry (menu above the
// trigger), not from `transformOrigin`, which browsers normalise ("bottom" reads back as "center bottom").
// Positions are rounded so the menu lands on whole pixels.
function onMenuShow() {
  if (!props.card) return;
  const el: HTMLElement | undefined = menu.value?.container;
  if (!el || !menuTrigger) return;
  const rect = menuTrigger.getBoundingClientRect();
  el.style.marginTop = "0px";
  const openedAbove = el.getBoundingClientRect().top < rect.top;
  // The trigger can sit on a half pixel (7.5px cell inset), so a whole-pixel menu cannot be exactly 4px away. Below,
  // rounding the sum gives 4.5px (as in the Figma frame 2069:2759). Above, the trigger top is floored so the gap is
  // the same 4.5px; rounding it (Math.round(n.5) = n + 1) would leave 3.5px.
  const top = openedAbove ? Math.floor(rect.top) - cardMenuGap - el.offsetHeight : rect.bottom + cardMenuGap;
  el.style.top = `${Math.round(top + window.scrollY)}px`;
  el.style.insetInlineStart = `${Math.round(Math.max(0, rect.right + window.scrollX - el.offsetWidth))}px`;
}

function onMenuHide() {
  menuRowKey.value = null;
  menuTrigger = null;
}

function toggleMenu(event: Event, data: any) {
  menuRowKey.value = data[props.dataKey];
  menuTrigger = event.currentTarget as HTMLElement | null;
  menuItems.value = [
    ...(props.detailsUrl || props.confirmDetails
      ? [
          {
            label: "Detalhes",
            lucideIcon: Eye,
            command: () => {
              if (props.confirmDetails) emit("details", data);
              else window.location.href = `${props.detailsUrl}/${data.id}`;
            },
          },
        ]
      : []),
    ...(props.editUrl || props.confirmEdit
      ? [
          {
            label: "Editar",
            lucideIcon: Pencil,
            command: () => {
              if (props.confirmEdit) emit("edit", data);
              else window.location.href = `${props.editUrl}/${data.id}`;
            },
          },
        ]
      : []),
    ...(props.deleteUrl || props.confirmDelete
      ? [
          {
            label: "Excluir",
            // Card: Figma's trash glyph has no inner lines (TrashIcon); other tables keep Lucide Trash2.
            // markRaw: the Menu model is reactive, and a stateful SFC inside it triggers a Vue warning.
            lucideIcon: props.card ? markRaw(TrashIcon) : Trash2,
            command: () => {
              if (props.confirmDelete) emit("delete", data);
              else window.location.href = `${props.deleteUrl}/${data.id}`;
            },
          },
        ]
      : []),
  ];
  menu.value.toggle(event);
}
</script>

<template>
  <div class="flex flex-col" :class="flush ? 'gap-0' : card ? 'gap-4' : 'gap-2'">
    <div class="flex items-center justify-between gap-3" :class="{ 'min-h-10 px-4 py-1': flush }">
      <div class="flex w-full items-center gap-2">
        <IconField class="icon-motion" :class="flush || card ? 'w-[216px] shrink-0' : 'w-full max-w-[280px]'">
          <InputIcon :class="flush ? flushSearchIconClass : card ? cardSearchIconClass : undefined">
            <!-- absoluteStrokeWidth scales by the `size` prop, not the CSS size: card passes the real 14px. -->
            <Search v-bind="card ? cardSearchIconProps : {}" />
          </InputIcon>
          <InputText
            v-model="searchTerm"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            class="w-full"
            :class="flush ? flushSearchInputClass : card ? cardSearchInputClass : undefined"
          />
        </IconField>
        <!-- Extra toolbar actions next to the search box (e.g. a "View all" link). -->
        <slot name="toolbar" />
      </div>
      <Button
        v-if="bulkDelete && selectedRows.length && card"
        :label="`Excluir selecionados (${selectedRows.length})`"
        severity="danger"
        outlined
        :class="cardBulkButtonClass"
        class="shrink-0"
        @click="onBulkDeleteClick"
      >
        <template #icon><TrashIcon /></template>
      </Button>
      <Button
        v-else-if="bulkDelete && selectedRows.length"
        label="Excluir selecionados"
        severity="danger"
        outlined
        :badge="String(selectedRows.length)"
        badge-severity="danger"
        @click="onBulkDeleteClick"
      >
        <template #icon><Trash2 /></template>
      </Button>
    </div>

    <!-- Flush: the table is the bottom of a 12px-radius, 1px-bordered card, so its own bottom corners
         use the 11px inner radius and clip the last (striped) row. The row menu is a popup appended to
         <body>, so this clipping never cuts it. -->
    <div
      :class="
        flush
          ? 'overflow-hidden rounded-b-[11px]'
          : card
            ? 'overflow-hidden rounded-xl border border-surface-200 shadow-sm'
            : 'rounded-xl border border-surface-300 overflow-hidden'
      "
    >
      <DataTable
        v-model:selection="selectedRows"
        :value="displayValue"
        :loading="loading"
        lazy
        :paginator="paginator"
        :striped-rows="stripedRows"
        row-hover
        :rows="rows"
        :rowsPerPageOptions="rowsPerPageOptions"
        :totalRecords="totalRecords"
        :first="first"
        :dataKey="dataKey"
        :row-class="rowClass"
        :sortField="sortField ?? undefined"
        :sortOrder="sortOrder ?? undefined"
        :class="['text-sm', card ? 'dt-card' : undefined]"
        :pt="card ? { pcPaginator: cardPaginatorPt, bodyRow: cardBodyRowPt } : { pcPaginator: paginatorPt }"
        :table-style="flush || card ? 'table-layout: fixed' : undefined"
        @page="(e) => $emit('page', e)"
        @sort="onSort"
      >
        <Column
          v-if="bulkDelete"
          selectionMode="multiple"
          :header-style="card ? 'width: 56px' : 'width: 3rem'"
          :pt="card ? cardSelectionColumnPt : undefined"
        />
        <Column
          v-for="col in columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable ?? true"
          :header-style="col.width ? { width: col.width } : undefined"
          :pt="flush ? flushColumnPt : card ? cardColumnPt : undefined"
        >
          <!-- Flush sort icon = Figma "sortIcon": Lucide arrow-up-down, 12px, 1.5px stroke, gray-500 (muted).
               Figma only draws the neutral state; asc/desc use arrow-up/arrow-down at the same size and inherit
               the sorted header's highlight colour. PrimeVue still sets aria-sort on the <th>. -->
          <template v-if="flush || card" #sorticon="{ sorted, sortOrder: order }">
            <ArrowUpDown v-if="!sorted" class="size-3 shrink-0 text-muted-color" :stroke-width="1.5" absolute-stroke-width />
            <ArrowUp v-else-if="order === 1" class="size-3 shrink-0" :stroke-width="1.5" absolute-stroke-width />
            <ArrowDown v-else class="size-3 shrink-0" :stroke-width="1.5" absolute-stroke-width />
          </template>
          <template #body="{ data }">
            <slot :name="`col-${col.field}`" :data="data">
              <!-- Card: every column is Figma body/md (14px) and inherits the row ink, so selected rows tint it. -->
              <span v-if="card">{{ data[col.field] }}</span>
              <span v-else :class="col.primary ? 'font-semibold text-color' : 'text-xs text-muted-color'">{{ data[col.field] }}</span>
            </slot>
          </template>
        </Column>
        <Column
          v-if="hasActions"
          header="Ações"
          :class="card ? undefined : 'text-center'"
          :style="card ? 'width: 80px' : 'width: 4rem'"
          :pt="card ? cardActionsColumnPt : undefined"
        >
          <template #body="{ data }">
            <!-- Card: Figma button-small icon-only (32px, 6px radius, 16px icon). -->
            <Button
              text
              :rounded="!card"
              severity="secondary"
              aria-haspopup="true"
              aria-label="Ações da linha"
              class="icon-motion"
              :class="[card ? cardMenuTriggerClass : undefined, card && menuRowKey === data[dataKey] ? 'bg-surface-50!' : undefined]"
              :aria-expanded="card ? menuRowKey === data[dataKey] : undefined"
              @click="toggleMenu($event, data)"
            >
              <!-- absoluteStrokeWidth scales by the `size` prop (default 24), not the CSS size: pass the real 16px. -->
              <EllipsisVertical v-if="card" :size="16" :stroke-width="1.5" absolute-stroke-width />
              <EllipsisVertical v-else />
            </Button>
          </template>
        </Column>
      </DataTable>
      <Menu
        ref="menu"
        :model="menuItems"
        :popup="true"
        :pt="card ? cardMenuPt : menuPt"
        @show="onMenuShow"
        @hide="onMenuHide"
      >
        <template #itemicon="{ item, class: iconClass }">
          <component
            :is="item.lucideIcon"
            v-if="item.lucideIcon"
            :class="[iconClass, card ? cardMenuPt.itemIcon.class : null]"
            v-bind="card ? { size: 14, strokeWidth: 1.5, absoluteStrokeWidth: true } : {}"
          />
        </template>
      </Menu>
    </div>
  </div>
</template>
