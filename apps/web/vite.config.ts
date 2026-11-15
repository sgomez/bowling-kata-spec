import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// `pnpm dev` sets PORT for both the server and this proxy.
const server = `localhost:${process.env.PORT}`;

export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      "/health": `http://${server}`,
      "/ws": { target: `ws://${server}`, ws: true },
    },
  },
});
