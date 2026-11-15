import { fileURLToPath } from "node:url";
import { createAppServer } from "./server.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const webRoot =
  process.env.WEB_ROOT ??
  fileURLToPath(new URL("../../web/dist", import.meta.url));

createAppServer({ webRoot }).listen(port, host, () => {
  console.log(`Servidor escuchando en http://${host}:${port}`);
});
