// import { defineConfig } from "vite";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// export default defineConfig({
//   plugins: [basicSsl()],
//   server: {
//     open: true,
//     port: 5173,
//   },
// });

import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { copy } from "vite-plugin-copy";

export default defineConfig({
  plugins: [
    basicSsl(),
    copy({
      targets: [
        { src: "node_modules/aframe/dist/aframe.min.js", dest: "dist" },
        {
          src: "node_modules/webxr-polyfill/build/webxr-polyfill.js",
          dest: "dist",
        },
      ],
    }),
  ],
  server: {
    open: true,
    port: 5173,
  },
  build: {
    base: "/",
    outDir: "dist",
    rollupOptions: {
      external: ["aframe"],
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/aframe")) return "aframe";
          if (id.includes("node_modules/webxr-polyfill"))
            return "webxr-polyfill";
          if (id.includes("node_modules/firebase")) return "firebase";
        },
      },
    },
    assetsInclude: ["**/*.glb"],
  },
  resolve: {
    alias: {
      "/node_modules": "./node_modules",
      "/firebase/app": "./node_modules/firebase/app/dist/index.mjs",
      "/firebase/firestore": "./node_modules/firebase/firestore/dist/index.mjs",
      "/firebase/storage": "./node_modules/firebase/storage/dist/index.mjs",
    },
  },
});
