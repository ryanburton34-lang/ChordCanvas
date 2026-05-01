import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: ".vite/build",
    emptyOutDir: false,
    lib: {
      entry: "electron/main.ts",
      formats: ["es"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: ["electron", "node:path", "node:url", "node:fs/promises"],
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  ssr: {
    noExternal: ["update-electron-app"],
  },
});