import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // Updates service worker automatically when there are changes
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"], // PWA assets
      manifest: {
        name: "PushBet",
        short_name: "PushBet",
        description: "An engaging fitness tracking game!",
        theme_color: "#ffffff",
        icons: [
          {
            src: "logo-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
  server: {
    https: {
      key: fs.readFileSync("./server.key"),
      cert: fs.readFileSync("./server.crt"),
    },
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
        secure: false,
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    }
  },
});
