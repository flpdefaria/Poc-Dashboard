<script setup lang="ts">
import { RouterView } from "vue-router";
import Toast from "primevue/toast";
import Sidebar from "./components/common/sidebar/Sidebar.vue";
</script>

<template>
  <Toast position="bottom-right" />
  <Sidebar />
  <div class="flex h-full min-w-0 flex-1 flex-col">
    <!-- Figma page margin: 40px around every page (dashboard node 2005:5301). -->
    <main role="main" class="flex-1 overflow-y-auto p-10">
      <RouterView v-slot="{ Component, route }">
        <Transition name="route" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
