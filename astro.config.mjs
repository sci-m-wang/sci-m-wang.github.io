import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://sci-m-wang.github.io",
  output: "static",
  integrations: [sitemap({ filter: (page) => !page.endsWith("/update/") })],
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
