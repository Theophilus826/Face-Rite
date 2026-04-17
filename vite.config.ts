import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    tailwindcss(),
    react(),

    // ✅ PWA Plugin Added
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["logos.jpg"],

      manifest: {
        name: "KingStream App",
        short_name: "KingStream",
        description: "Play, chat, and earn coins",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/logos.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any maskable",
          },
          {
            src: "/logos.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        // ✅ Fix build crash (increase limit)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

        // ✅ VERY IMPORTANT: ignore Babylon (huge file)
        globIgnores: ["**/babylonVendor-*.js"],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/swordgame-5\.onrender\.com\/api/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true, // ✅ allows PWA in dev mode
      },
    }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "https://swordgame-5.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ React ecosystem
          reactVendor: ["react", "react-dom", "react-router-dom"],

          // ✅ Babylon.js isolated
          babylonVendor: ["@babylonjs/core", "@babylonjs/gui"],

          // ✅ Optional heavy libs
          networkVendor: ["axios", "socket.io-client"],
        },
      },
    },
  },
});
