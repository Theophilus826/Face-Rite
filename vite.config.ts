import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
   base: "/Face-Rite/",
  plugins: [tailwindcss(), react()],

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
          /* ✅ React ecosystem */
          reactVendor: ["react", "react-dom", "react-router-dom"],

          /* ✅ Babylon.js isolated */
          babylonVendor: [
            "@babylonjs/core",
            "@babylonjs/gui",
          ],

          /* ✅ Optional other heavy libs */
          networkVendor: ["axios", "socket.io-client"],
        },
      },
    },
  },
});