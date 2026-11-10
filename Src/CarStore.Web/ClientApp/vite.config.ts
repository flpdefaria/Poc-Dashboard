import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// "/dist/" matches the built asset paths ~/dist/main.js|main.css referenced by
// _Layout.cshtml; the dev server instead serves everything from "/" so
// http://localhost:5173/@vite/client and /src/main.ts resolve directly.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/dist/" : "/",
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    // The page is served by the ASP.NET app on a different origin (5045),
    // not by Vite itself. Without this, root-relative asset URLs injected by
    // Vite (e.g. a CSS url(/node_modules/...) for a font or image) resolve
    // against the document's origin instead of the dev server, 404ing.
    origin: "http://localhost:5173",
  },
  plugins: [vue(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, "../wwwroot/dist"),
    emptyOutDir: true,
    rolldownOptions: {
      input: path.resolve(__dirname, "src/main.ts"),
      output: {
        entryFileNames: "main.js",
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith(".css") ? "main.css" : "[name][extname]",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },
}));
