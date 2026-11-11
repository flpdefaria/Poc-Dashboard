import "./style.css";
// Lucide hover/focus gestures (ported from Atlas); opt in with the `icon-motion` host class.
import "./styles/icon-motion.css";
import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import App from "./App.vue";
import router from "./router";
import { CarStorePreset } from "./plugins/primevue-preset";
import { primeVueLocalePtBr } from "./plugins/primevue-locale-pt-br";

const el = document.querySelector<HTMLElement>("#app");
if (el) {
  createApp(App)
    .use(router)
    .use(PrimeVue, {
      theme: { preset: CarStorePreset, options: { darkModeSelector: false } },
      locale: primeVueLocalePtBr,
    })
    .use(ToastService)
    .mount(el);
}

