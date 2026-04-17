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

      includeAssets: ["globle.png"],

      manifest: {
        name: "KingStream App",
        short_name: "KingStream",
        description: "Play, chat, and earn coins",
        theme_color: "#d2d450b9",
        background_color: "#580a0a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/globle.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/globle.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/swordgame-5\.onrender\.com\/api/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
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