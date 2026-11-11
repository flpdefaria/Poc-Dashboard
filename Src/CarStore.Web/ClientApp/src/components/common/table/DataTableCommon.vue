<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue";
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from "primevue/datatable";
import Column from "primevue/column";
import Menu from "primevue/menu";
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import { rowEffectClass } from "../../../utils/rowEffects";
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
  itemLink: { class: "gap-1.75 rounded-md px-[10.5px] py-[7px] text-sm font-normal text-color" },
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
  headerCell: { class: "px-3.5! py-[9.5px]!" },
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

function toggleMenu(event: Event, data: any) {
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
            lucideIcon: Trash2,
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
  <div class="flex flex-col" :class="flush ? 'gap-0' : 'gap-2'">
    <div class="flex items-center justify-between gap-3" :class="{ 'min-h-10 px-4 py-1': flush }">
      <div class="flex w-full items-center gap-2">
        <IconField :class="flush ? 'w-[216px] shrink-0' : 'w-full max-w-[280px]'">
          <InputIcon :class="flush ? flushSearchIconClass : undefined"><Search /></InputIcon>
          <InputText
            v-model="searchTerm"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            class="w-full"
            :class="flush ? flushSearchInputClass : undefined"
          />
        </IconField>
        <!-- Extra toolbar actions next to the search box (e.g. a "View all" link). -->
        <slot name="toolbar" />
      </div>
      <Button
        v-if="bulkDelete && selectedRows.length"
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
    <div :class="flush ? 'overflow-hidden rounded-b-[11px]' : 'rounded-xl border border-surface-300 overflow-hidden'">
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
        :row-class="(row: any) => rowEffectClass(effectScope, row[dataKey])"
        :sortField="sortField ?? undefined"
        :sortOrder="sortOrder ?? undefined"
        class="text-sm"
        :pt="{ pcPaginator: paginatorPt }"
        :table-style="flush ? 'table-layout: fixed' : undefined"
        @page="(e) => $emit('page', e)"
        @sort="onSort"
      >
        <Column v-if="bulkDelete" selectionMode="multiple" header-style="width: 3rem" />
        <Column
          v-for="col in columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable ?? true"
          :header-style="col.width ? { width: col.width } : undefined"
          :pt="flush ? flushColumnPt : undefined"
        >
          <!-- Flush sort icon = Figma "sortIcon": Lucide arrow-up-down, 12px, 1.5px stroke, gray-500 (muted).
               Figma only draws the neutral state; asc/desc use arrow-up/arrow-down at the same size and inherit
               the sorted header's highlight colour. PrimeVue still sets aria-sort on the <th>. -->
          <template v-if="flush" #sorticon="{ sorted, sortOrder: order }">
            <ArrowUpDown v-if="!sorted" class="size-3 shrink-0 text-muted-color" :stroke-width="1.5" absolute-stroke-width />
            <ArrowUp v-else-if="order === 1" class="size-3 shrink-0" :stroke-width="1.5" absolute-stroke-width />
            <ArrowDown v-else class="size-3 shrink-0" :stroke-width="1.5" absolute-stroke-width />
          </template>
          <template #body="{ data }">
            <slot :name="`col-${col.field}`" :data="data">
              <span :class="col.primary ? 'font-semibold text-color' : 'text-xs text-muted-color'">{{ data[col.field] }}</span>
            </slot>
          </template>
        </Column>
        <Column v-if="hasActions" header="Ações" class="text-center" style="width: 4rem">
          <template #body="{ data }">
            <Button text rounded severity="secondary" aria-haspopup="true" aria-label="Ações da linha" @click="toggleMenu($event, data)">
              <EllipsisVertical />
            </Button>
          </template>
        </Column>
      </DataTable>
      <Menu ref="menu" :model="menuItems" :popup="true" :pt="menuPt">
        <template #itemicon="{ item, class: iconClass }">
          <component :is="item.lucideIcon" v-if="item.lucideIcon" :class="iconClass" />
        </template>
      </Menu>
    </div>
  </div>
</template>
