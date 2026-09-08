import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Domaine de production. Source de vérité applicative : src/config/site.ts
// (dupliqué ici car la config Astro est chargée avant l'app). ⚠️ Garder les deux
// valeurs synchronisées.
const SITE_URL = "https://www.vortexoptim.fr";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: "ignore",
  build: {
    // Inline les petites feuilles de style pour réduire les requêtes au premier
    // rendu (budget de performance §6.2).
    inlineStylesheets: "auto",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
