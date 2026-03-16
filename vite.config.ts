// vite.config.ts
// Vite is the tool that:
// 1. Bundles your TypeScript files into one JS file the browser can run
// 2. Gives you a live dev server (auto-refreshes on file save)
// 3. Handles the TypeScript compilation for you

import { defineConfig } from "vite";

export default defineConfig({
  // "root" tells Vite where your index.html lives
  root: ".",

  build: {
    // Output compiled files to dist/
    outDir: "dist",

    rollupOptions: {
      input: "index.html",
    },
  },

  server: {
    port: 3000,
    open: true, // Opens browser automatically when you run "npm run dev"
  },
});
