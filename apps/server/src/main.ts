import { readServerConfig } from "./config.js";
import { createAppServer } from "./server.js";

const SHUTDOWN_GRACE_MS = 5000;

const { port, host, webRoot } = readServerConfig(process.env);
const server = createAppServer({ webRoot });

server.listen(port, host, () => {
  console.log(`Servidor escuchando en http://${host}:${port}`);
});

process.on("SIGTERM", () => {
  setTimeout(() => process.exit(0), SHUTDOWN_GRACE_MS).unref();
  server.shutdown().then(() => process.exit(0));
});
