<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { type DataTablePageEvent } from "primevue/datatable";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import Message from "primevue/message";
import DataTableCommon, { type DataTableColumn } from "./common/table/DataTableCommon.vue";
import BarChart from "./common/chart/BarChart.vue";
import PoweredByBadge from "./PoweredByBadge.vue";
import ShowroomLoader from "./common/loader/ShowroomLoader.vue";
import { usePagedFetch } from "../composables/usePagedFetch";
import { useTweenedNumber } from "../composables/useTweenedNumber";
import { formatCurrency, formatDate } from "../utils/format";
import { primaryButtonClass } from "../styles/buttonStyles";
import type { BrandDto, CarDto, CustomerDto } from "../types";
import { ArrowRight, Car, CircleCheck, IdCard, Wallet } from "@lucide/vue";

const carsApiUrl = "/api/cars";
const brandsApiUrl = "/api/brands";
const customersApiUrl = "/api/customers";

// Aggregate loads (fleet is well under the 100-row page cap) used to compute the stat cards and charts below.
const { items: cars, load: loadCars } = usePagedFetch<CarDto>(carsApiUrl);
const { items: brands, load: loadBrands } = usePagedFetch<BrandDto>(brandsApiUrl);
const { items: customersForActivity, load: loadCustomersForActivity } = usePagedFetch<CustomerDto>(customersApiUrl);

// Real, server-paged preview of the customers list (separate from the aggregate load above).
const recentRows = ref(5);
const recentFirst = ref(0);
const {
  items: recentCustomers,
  totalRecords: recentTotal,
  loading: recentLoading,
  error: recentError,
  load: loadRecentCustomers,
} = usePagedFetch<CustomerDto>(customersApiUrl);

const recentColumns: DataTableColumn[] = [
  { field: "fullName", header: "Customer", primary: true },
  { field: "email", header: "Email" },
  { field: "createdAt", header: "Joined" },
];

function onRecentPage(event: DataTablePageEvent) {
  recentFirst.value = event.first;
  recentRows.value = event.rows;
  loadRecentCustomers(event.page + 1, event.rows);
}

// Full-screen showroom loader: plays once per session, on the first visit to Home. Later visits
// skip straight to the reveal. `ready` gates the text reveal, KPI counts, bars and chart, so they
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
    track(loadRecentCustomers(1, recentRows.value)),
    minimumShow,
  ]);
  if (!showLoader.value) return;
  // Let the bar visibly land on 100% before the car drives off.
  await new Promise((resolve) => setTimeout(resolve, 500));
  introPlayed = true;
  showLoader.value = false;
});

// Stat cards - real aggregates from the fetched fleet, no fabricated deltas or history.
const carsInStock = computed(() => cars.value.reduce((sum, c) => sum + c.stock, 0));
const fleetValue = computed(() => cars.value.reduce((sum, c) => sum + c.price * c.stock, 0));
const availableCars = computed(() => cars.value.filter((c) => c.isAvailable).length);
const availabilityRate = computed(() =>
  cars.value.length ? Math.round((availableCars.value / cars.value.length) * 100) : 0,
);

// Stat values count up from 0 once the page is revealed, staggered left to right with the cards.
const countDuration = 1800;
const gated = (value: () => number) => computed(() => (ready.value ? value() : 0));
const fleetValueShown = useTweenedNumber(gated(() => fleetValue.value), countDuration, 200);
const carsInStockShown = useTweenedNumber(gated(() => carsInStock.value), countDuration, 300);
const recentTotalShown = useTweenedNumber(gated(() => recentTotal.value), countDuration, 400);
const availabilityRateShown = useTweenedNumber(gated(() => availabilityRate.value), countDuration, 500);

// Fleet-by-brand mix: top brands by registered car count.
const totalBrandCars = computed(() => brands.value.reduce((sum, b) => sum + b.carsCount, 0));
const topBrands = computed(() => [...brands.value].sort((a, b) => b.carsCount - a.carsCount).slice(0, 5));
// Paint swatches in rank order (see style.css @theme); the percentage label carries the value, not the hue.
const brandDotClasses = ["bg-paint-gulf", "bg-paint-green", "bg-paint-bronze", "bg-paint-burgundy", "bg-paint-graphite"];

function brandSharePercent(carsCount: number): number {
  return totalBrandCars.value ? Math.round((carsCount / totalBrandCars.value) * 100) : 0;
}

// New customers over time, grouped by the selected period - real `createdAt` data, no synthetic history.
const periodOptions = ["Weekly", "Monthly", "Yearly"];
const period = ref("Monthly");

function bucketLabel(createdAt: string): string {
  const date = new Date(createdAt);
  if (period.value === "Yearly") return `${date.getFullYear()}`;
  if (period.value === "Weekly") {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(((date.getTime() - firstDay.getTime()) / 86400000 + firstDay.getDay() + 1) / 7);
    return `Wk ${week}`;
  }
  return date.toLocaleDateString("en-US", { month: "short" });
}

const activityBuckets = computed(() => {
  const sorted = [...customersForActivity.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const buckets = new Map<string, number>();
  for (const customer of sorted) {
    const label = bucketLabel(customer.createdAt);
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  return Array.from(buckets, ([label, count]) => ({ label, count }));
});
const activityLabels = computed(() => activityBuckets.value.map((b) => b.label));
const activityValues = computed(() => activityBuckets.value.map((b) => b.count));
</script>

<script lang="ts">
// Module scope: survives Home being unmounted, so the loader only plays on the first visit.
let introPlayed = false;
</script>

<template>
  <div class="flex flex-col gap-4" :class="{ 'home-ready': ready }">
    <!-- Teleported: the route transition transforms this page, which would offset a fixed overlay. -->
    <Teleport to="body">
      <Transition name="loader" @before-leave="ready = true">
        <ShowroomLoader v-if="showLoader" :progress="loaderProgress" />
      </Transition>
    </Teleport>

    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-black text-surface-700" aria-label="Fleet command">
          <span v-for="(word, i) in ['Fleet', 'command']" :key="word" class="headline-word" aria-hidden="true">
            <span class="headline-word-inner" :style="{ '--i': i }">{{ word }}</span>
          </span>
        </h1>
        <p class="reveal text-sm text-muted-color" style="--i: 2">Monitor stock exposure, fleet value, and recent customer activity.</p>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card class="reveal !rounded-xl !bg-paint-bronze/5 !shadow-sm" style="--i: 3">
        <template #content>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-color">Fleet value</span>
            <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-paint-bronze/12">
              <Wallet class="text-xl text-paint-bronze" />
            </div>
          </div>
          <p class="mt-1.75 text-[32px] font-bold text-surface-700 tabular-nums">{{ formatCurrency(Math.round(fleetValueShown)) }}</p>
        </template>
      </Card>

      <Card class="reveal !rounded-xl !bg-paint-gulf/5 !shadow-sm" style="--i: 4">
        <template #content>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-color">Car in stock</span>
            <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-paint-gulf/12">
              <Car class="text-xl text-paint-gulf" />
            </div>
          </div>
          <p class="mt-1.75 text-[32px] font-bold text-surface-700 tabular-nums">{{ Math.round(carsInStockShown) }}</p>
        </template>
      </Card>

      <Card class="reveal !rounded-xl !bg-paint-green/5 !shadow-sm" style="--i: 5">
        <template #content>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-color">Registered customers</span>
            <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-paint-green/12">
              <IdCard class="text-xl text-paint-green" />
            </div>
          </div>
          <p class="mt-1.75 text-[32px] font-bold text-surface-700 tabular-nums">{{ Math.round(recentTotalShown) }}</p>
          <Tag value="Live" severity="info" class="mt-1.75 !text-xs" />
        </template>
      </Card>

      <Card class="reveal !rounded-xl !bg-paint-graphite/5 !shadow-sm" style="--i: 6">
        <template #content>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-color">Availability rate</span>
            <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-paint-graphite/12">
              <CircleCheck class="text-xl text-paint-graphite" />
            </div>
          </div>
          <p class="mt-1.75 text-[32px] font-bold text-surface-700 tabular-nums">{{ Math.round(availabilityRateShown) }}%</p>
          <Tag
            :value="availabilityRate >= 50 ? 'High' : 'Low'"
            :severity="availabilityRate >= 50 ? 'success' : 'warn'"
            class="mt-1.75 !text-xs"
          />
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <Card class="!rounded-xl !shadow-sm xl:col-span-2">
        <template #content>
          <div class="flex items-center justify-between">
            <p class="reveal text-sm font-semibold text-color" style="--i: 7">New customers</p>
            <SelectButton v-model="period" :options="periodOptions" :allow-empty="false" class="text-xs" />
          </div>
          <div class="mt-4">
            <!-- Mounted on reveal so the bars grow in view rather than behind the loader. -->
            <div v-if="!ready" class="h-40"></div>
            <BarChart v-else-if="activityBuckets.length" :labels="activityLabels" :values="activityValues" color-var="--color-paint-gulf" />
            <p v-else class="flex h-40 items-center justify-center text-sm text-muted-color">No customer activity yet.</p>
          </div>
        </template>
      </Card>

      <Card class="!rounded-xl !shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <p class="reveal text-sm font-semibold text-color" style="--i: 8">Fleet by brand</p>
          </div>
          <!-- Fleet mix at a glance: one segmented bar, same swatches as the list below. -->
          <div
            v-if="topBrands.length"
            class="reveal mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
            style="--i: 9"
            role="img"
            :aria-label="`Fleet mix: ${topBrands.map((b) => `${b.name} ${brandSharePercent(b.carsCount)}%`).join(', ')}`"
          >
            <div
              v-for="(brand, index) in topBrands"
              :key="brand.id"
              class="h-full"
              :class="brandDotClasses[index]"
              :style="{ width: `${brandSharePercent(brand.carsCount)}%` }"
            ></div>
            <div class="h-full flex-1 bg-surface-200"></div>
          </div>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="(brand, index) in topBrands" :key="brand.id" class="flex flex-col gap-1.5 text-sm">
              <div class="flex items-center gap-1.75">
                <span class="size-2 shrink-0 rounded-full" :class="brandDotClasses[index]"></span>
                <span class="min-w-0 flex-1 truncate text-color">{{ brand.name }}</span>
                <span class="shrink-0 text-xs font-medium text-muted-color">{{ brandSharePercent(brand.carsCount) }}%</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
                <div
                  class="bar-fill h-full rounded-full"
                  :class="brandDotClasses[index]"
                  :style="{ width: `${brandSharePercent(brand.carsCount)}%`, '--bar-delay': `${index * 70}ms` }"
                ></div>
              </div>
            </li>
            <li v-if="!topBrands.length" class="text-sm text-muted-color">No brands registered yet.</li>
          </ul>
          <Button :as="RouterLink" to="/brands" :class="primaryButtonClass + ' mt-4 w-full justify-center'">
            View brands
            <ArrowRight class="text-xs" />
          </Button>
        </template>
      </Card>
    </div>

    <Card class="!rounded-xl !shadow-sm">
      <template #content>
        <div class="flex items-center justify-between">
          <p class="reveal text-sm font-semibold text-color" style="--i: 9">Recent customers</p>
          <Button :as="RouterLink" to="/customers" :class="primaryButtonClass">
            View all
            <ArrowRight class="text-xs" />
          </Button>
        </div>
        <Message v-if="recentError" severity="error" :closable="false" class="mt-3">{{ recentError }}</Message>
        <div class="mt-3">
          <DataTableCommon
            :value="recentCustomers"
            :columns="recentColumns"
            :loading="recentLoading"
            :total-records="recentTotal"
            :first="recentFirst"
            :rows="recentRows"
            :rows-per-page-options="[5, 10]"
            @page="onRecentPage"
          >
            <template #col-createdAt="{ data }">
              <span class="text-xs text-muted-color">{{ formatDate(data.createdAt) }}</span>
            </template>
          </DataTableCommon>
        </div>
      </template>
    </Card>

    <div class="flex items-center justify-between">
      <PoweredByBadge />
      <Button :as="RouterLink" to="/cars" :class="primaryButtonClass">
        <Car />
        Manage fleet
      </Button>
    </div>
  </div>
</template>

