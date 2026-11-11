import "./style.css";
import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import App from "./App.vue";
import router from "./router";
import { CarStorePreset } from "./plugins/primevue-preset";

const el = document.querySelector<HTMLElement>("#app");
if (el) {
  createApp(App)
    .use(router)
    .use(PrimeVue, { theme: { preset: CarStorePreset, options: { darkModeSelector: false } } })
    .use(ToastService)
    .mount(el);
}

