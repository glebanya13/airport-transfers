import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: { crawlLinks: true },
    pages: [
      { path: "/en" },
      { path: "/es" },
      { path: "/ru" },
      { path: "/en/prices" },
      { path: "/en/fleet" },
      { path: "/en/book" },
      { path: "/en/my-booking" },
      { path: "/es/prices" },
      { path: "/es/fleet" },
      { path: "/es/book" },
      { path: "/es/my-booking" },
      { path: "/ru/prices" },
      { path: "/ru/fleet" },
      { path: "/ru/book" },
      { path: "/ru/my-booking" },
    ],
    spa: { enabled: true },
  },
});
