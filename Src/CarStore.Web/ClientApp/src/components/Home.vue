<script setup lang="ts">
import { computed, onMounted, ref, type Component } from "vue";
import { RouterLink } from "vue-router";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import Message from "primevue/message";
import Tooltip from "primevue/tooltip";
import DataTableCommon, { type DataTableColumn } from "./common/table/DataTableCommon.vue";
import BarChart from "./common/chart/BarChart.vue";
import PageHeader from "./common/pageheader/PageHeader.vue";
import ShowroomLoader from "./common/loader/ShowroomLoader.vue";
import { usePagedFetch } from "../composables/usePagedFetch";
import { useTweenedNumber } from "../composables/useTweenedNumber";
import { formatCurrency, formatCurrencyCompact, formatDate } from "../utils/format";
import { primaryButtonClass, primarySmallButtonClass } from "../styles/buttonStyles";
import type { BrandDto, CarDto, CustomerDto } from "../types";
import { ArrowRight, Car, CircleCheck, IdCard, Wallet } from "@lucide/vue";

const vTooltip = Tooltip;

// Figma "Central da frota" (EOvtzuJAvw1UnoH9tsYmiO, node 2005:5266).

const carsApiUrl = "/api/cars";
const brandsApiUrl = "/api/brands";
const customersApiUrl = "/api/customers";

// Aggregate loads (fleet is well under the 100-row page cap) used to compute the KPI cards and charts below.
const { items: cars, error: carsError, load: loadCars } = usePagedFetch<CarDto>(carsApiUrl);
const { items: brands, error: brandsError, load: loadBrands } = usePagedFetch<BrandDto>(brandsApiUrl);
const {
  items: customersForActivity,
  error: activityError,
  load: loadCustomersForActivity,
} = usePagedFetch<CustomerDto>(customersApiUrl);
const aggregateError = computed(() => carsError.value ?? brandsError.value ?? activityError.value);

// Real, server-paged preview of the customers list (first page only; "Ver todos" opens the full list).
const recentRows = 5;
const {
  items: recentCustomers,
  totalRecords: recentTotal,
  loading: recentLoading,
  error: recentError,
  load: loadRecentCustomers,
} = usePagedFetch<CustomerDto>(customersApiUrl);

const recentColumns: DataTableColumn[] = [
  { field: "fullName", header: "Cliente", primary: true },
  { field: "email", header: "E-mail", sortable: false },
  { field: "createdAt", header: "Cadastrado em", sortable: false },
];

// Full-screen showroom loader: plays once per session, on the first visit to Home. Later visits
// skip straight to the reveal. `ready` gates the reveal, KPI counts, bars and chart, so they
// start as the loader leaves instead of playing out behind it.
const showLoader = ref(!introPlayed);
const ready = ref(introPlayed);
const loadsDone = ref(0);
const startupLoads = 4;
const loaderProgress = computed(() => (loadsDone.value / startupLoads) * 100);

function track(request: Promise<void>) {
  return request.finally(() => loadsDone.value++);
}

onMounted(async () => {
  const minimumShow = new Promise((resolve) => setTimeout(resolve, showLoader.value ? 1100 : 0));
  await Promise.all([
    track(loadCars(1, 100)),
    track(loadBrands(1, 100)),
    track(loadCustomersForActivity(1, 100)),
    track(loadRecentCustomers(1, recentRows)),
    minimumShow,
  ]);
  if (!showLoader.value) return;
  // Let the bar visibly land on 100% before the car drives off.
  await new Promise((resolve) => setTimeout(resolve, 500));
  introPlayed = true;
  showLoader.value = false;
});

// Shared panel look (Figma "_kpi-card" / panels): 12px radius, neutral border, 18px body.
// `!` overrides PrimeVue's own `.p-card` radius/shadow and `.p-card-body` padding.
const panelPt = {
  root: { class: "rounded-xl! border border-surface-200 shadow-sm!" },
  body: { class: "h-full p-[18px]! gap-0!" },
  content: { class: "flex h-full flex-col" },
};
const tagPt = { root: { class: "self-start rounded-md! px-1.5! py-0.5! text-[11px]! font-medium!" } };

// KPI cards - real aggregates from the fetched fleet, no fabricated deltas or history.
const carsInStock = computed(() => cars.value.reduce((sum, c) => sum + c.stock, 0));
const fleetValue = computed(() => cars.value.reduce((sum, c) => sum + c.price * c.stock, 0));
const availableCars = computed(() => cars.value.filter((c) => c.isAvailable).length);
const availabilityRate = computed(() =>
  cars.value.length ? Math.round((availableCars.value / cars.value.length) * 100) : 0,
);

// Values count up from 0 once the page is revealed, staggered left to right with the cards.
const countDuration = 1800;
const gated = (value: () => number) => computed(() => (ready.value ? value() : 0));
const fleetValueShown = useTweenedNumber(gated(() => fleetValue.value), countDuration, 200);
const carsInStockShown = useTweenedNumber(gated(() => carsInStock.value), countDuration, 300);
const recentTotalShown = useTweenedNumber(gated(() => recentTotal.value), countDuration, 400);
const availabilityRateShown = useTweenedNumber(gated(() => availabilityRate.value), countDuration, 500);

interface Kpi {
  label: string;
  icon: Component;
  value: string;
  /** Full value shown on hover/focus when `value` is abbreviated. */
  tooltip?: string;
  tag?: { value: string; severity: "info" | "success" | "warn" };
}

const kpis = computed<Kpi[]>(() => [
  {
    label: "Valor da frota",
    icon: Wallet,
    value: formatCurrencyCompact(Math.round(fleetValueShown.value)),
    tooltip: formatCurrency(fleetValue.value),
  },
  { label: "Carros em estoque", icon: Car, value: String(Math.round(carsInStockShown.value)) },
  {
    label: "Clientes cadastrados",
    icon: IdCard,
    value: String(Math.round(recentTotalShown.value)),
    tag: { value: "Ao vivo", severity: "info" },
  },
  {
    label: "Taxa de disponibilidade",
    icon: CircleCheck,
    value: `${Math.round(availabilityRateShown.value)}%`,
    tag: availabilityRate.value >= 50 ? { value: "Alta", severity: "success" } : { value: "Baixa", severity: "warn" },
  },
]);

// Fleet by brand: top 5 brands by registered car count, the rest folded into "Outros".
// Paint swatches in rank order (see style.css @theme); the percentage label carries the value, not the hue.
const brandFillClasses = ["bg-paint-violet", "bg-paint-rust", "bg-paint-teal", "bg-paint-bronze", "bg-paint-burgundy"];
const totalBrandCars = computed(() => brands.value.reduce((sum, b) => sum + b.carsCount, 0));

function sharePercent(count: number): number {
  return totalBrandCars.value ? Math.round((count / totalBrandCars.value) * 100) : 0;
}

const brandRows = computed(() => {
  const sorted = [...brands.value].sort((a, b) => b.carsCount - a.carsCount);
  const rows = sorted.slice(0, 5).map((b, index) => ({
    key: String(b.id),
    name: b.name,
    percent: sharePercent(b.carsCount),
    fillClass: brandFillClasses[index],
  }));
  const otherCount = sorted.slice(5).reduce((sum, b) => sum + b.carsCount, 0);
  if (otherCount > 0) {
    rows.push({ key: "others", name: "Outros", percent: sharePercent(otherCount), fillClass: "bg-paint-graphite" });
  }
  return rows;
});

// New customers per period - real `createdAt` data over a fixed trailing window, zero-filled
// so empty periods stay visible (Figma shows 12 consecutive months, December to November).
const periodOptions = [
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
  { label: "Anual", value: "yearly" },
];
type Period = "weekly" | "monthly" | "yearly";
const period = ref<Period>("monthly");

const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const dayMonthLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function bucketKey(date: Date): string {
  if (period.value === "yearly") return `${date.getFullYear()}`;
  if (period.value === "monthly") return `${date.getFullYear()}-${date.getMonth()}`;
  return startOfWeek(date).toDateString();
}

const activityBuckets = computed(() => {
  const now = new Date();
  const buckets: { key: string; label: string; count: number }[] = [];
  if (period.value === "monthly") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: bucketKey(d), label: monthLabel.format(d).replace(".", ""), count: 0 });
    }
  } else if (period.value === "weekly") {
    const thisWeek = startOfWeek(now);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - i * 7);
      buckets.push({ key: bucketKey(d), label: dayMonthLabel.format(d), count: 0 });
    }
  } else {
    const years = customersForActivity.value.map((c) => new Date(c.createdAt).getFullYear());
    const first = years.length ? Math.min(...years) : now.getFullYear();
    for (let y = first; y <= now.getFullYear(); y++) buckets.push({ key: `${y}`, label: `${y}`, count: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const customer of customersForActivity.value) {
    const bucket = byKey.get(bucketKey(new Date(customer.createdAt)));
    if (bucket) bucket.count++;
  }
  return buckets;
});
const activityLabels = computed(() => activityBuckets.value.map((b) => b.label));
const activityValues = computed(() => activityBuckets.value.map((b) => b.count));
const activityTotal = computed(() => activityValues.value.reduce((sum, v) => sum + v, 0));
const activityAriaLabel = computed(
  () =>
    `Gráfico de barras: novos clientes por período. ` +
    activityBuckets.value.map((b) => `${b.label}: ${b.count}`).join(", "),
);
</script>

<script lang="ts">
// Module scope: survives Home being unmounted, so the loader only plays on the first visit.
let introPlayed = false;
</script>

<template>
  <div class="flex flex-col gap-6" :class="{ 'home-ready': ready }">
    <!-- Teleported: the route transition transforms this page, which would offset a fixed overlay. -->
    <Teleport to="body">
      <Transition name="loader" @before-leave="ready = true">
        <ShowroomLoader v-if="showLoader" :progress="loaderProgress" />
      </Transition>
    </Teleport>

    <PageHeader
      class="reveal"
      style="--i: 0"
      title="Central da frota"
      description="Acompanhe o valor da frota, o estoque e a atividade recente de clientes."
    />

    <Message v-if="aggregateError" severity="error" :closable="false">{{ aggregateError }}</Message>

    <!-- KPIs (Figma 2007:102) -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="(kpi, index) in kpis" :key="kpi.label" class="reveal" :style="{ '--i': index + 1 }" :pt="panelPt">
        <template #content>
          <div class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-sm text-muted-color">{{ kpi.label }}</span>
            <div class="flex shrink-0 items-center justify-center rounded-md bg-surface-100 p-2">
              <component :is="kpi.icon" class="size-5 text-color" />
            </div>
          </div>
          <p
            v-if="kpi.tooltip"
            v-tooltip.top="kpi.tooltip"
            tabindex="0"
            class="mt-2 truncate text-[48px] font-semibold leading-14 tracking-[-0.96px] text-color tabular-nums"
            :aria-label="`${kpi.label}: ${kpi.tooltip}`"
          >
            {{ kpi.value }}
          </p>
          <p v-else class="mt-2 truncate text-[48px] font-semibold leading-14 tracking-[-0.96px] text-color tabular-nums">
            {{ kpi.value }}
          </p>
          <Tag v-if="kpi.tag" :value="kpi.tag.value" :severity="kpi.tag.severity" class="mt-2" :pt="tagPt" />
        </template>
      </Card>
    </div>

    <!-- Insights (Figma 2008:3751) -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <!-- New customers (Figma 2008:3752) -->
      <Card class="reveal" style="--i: 5" :pt="panelPt">
        <template #content>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h2 class="text-base font-semibold text-color">Novos clientes</h2>
            <SelectButton
              v-model="period"
              :options="periodOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-label="Período"
            />
          </div>
          <div class="mt-6">
            <!-- Mounted on reveal so the bars grow in view rather than behind the loader. -->
            <div v-if="!ready" class="h-[332px]"></div>
            <p v-else-if="!activityTotal" class="flex h-[332px] items-center justify-center text-sm text-muted-color">
              Nenhum cliente novo neste período.
            </p>
            <BarChart
              v-else
              :labels="activityLabels"
              :values="activityValues"
              :height="332"
              :aria-label="activityAriaLabel"
              color-var="--color-paint-violet"
            />
          </div>
        </template>
      </Card>

      <!-- Fleet by brand (Figma 2008:3784) -->
      <Card class="reveal" style="--i: 6" :pt="panelPt">
        <template #content>
          <h2 class="text-base font-semibold text-color">Frota por marca</h2>
          <ul class="mt-6 flex flex-col gap-4">
            <li v-for="(row, index) in brandRows" :key="row.key" class="flex flex-col gap-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="min-w-0 flex-1 truncate text-color">{{ row.name }}</span>
                <span class="shrink-0 text-muted-color tabular-nums">{{ row.percent }}%</span>
              </div>
              <div
                class="h-2 w-full overflow-hidden rounded bg-surface-200"
                role="meter"
                :aria-label="row.name"
                :aria-valuenow="row.percent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="bar-fill h-full rounded"
                  :class="row.fillClass"
                  :style="{ width: `${row.percent}%`, '--bar-delay': `${index * 70}ms` }"
                ></div>
              </div>
            </li>
            <li v-if="!brandRows.length" class="text-sm text-muted-color">Nenhuma marca cadastrada.</li>
          </ul>
          <Button :as="RouterLink" to="/brands" :class="primaryButtonClass + ' mt-auto w-full justify-start!'">
            Ver marcas
            <ArrowRight />
          </Button>
        </template>
      </Card>
    </div>

    <!-- Recent customers (Figma 2037:268 / table 2009:212) -->
    <Card
      class="reveal"
      style="--i: 7"
      :pt="{ ...panelPt, body: { class: 'p-0! gap-0!' }, content: { class: 'flex flex-col' } }"
    >
      <template #content>
        <!-- Figma table header: 56px (16px above and below the 24px title). -->
        <h2 class="p-4 text-base font-semibold text-color">Clientes recentes</h2>
        <Message v-if="recentError" severity="error" :closable="false" class="mx-4 mb-2">{{ recentError }}</Message>
        <DataTableCommon
          :value="recentCustomers"
          :columns="recentColumns"
          :loading="recentLoading"
          :total-records="recentTotal"
          :rows="recentRows"
          :paginator="false"
          striped-rows
          flush
          search-placeholder="Buscar nesta página…"
        >
          <template #toolbar>
            <Button :as="RouterLink" to="/customers" :class="primarySmallButtonClass + ' shrink-0'">
              Ver todos
              <ArrowRight />
            </Button>
          </template>
          <template #col-fullName="{ data }">
            <span class="text-color">{{ data.fullName }}</span>
          </template>
          <template #col-email="{ data }">
            <span class="text-color">{{ data.email }}</span>
          </template>
          <template #col-createdAt="{ data }">
            <span class="text-color tabular-nums">{{ formatDate(data.createdAt) }}</span>
          </template>
        </DataTableCommon>
      </template>
    </Card>
  </div>
</template>
