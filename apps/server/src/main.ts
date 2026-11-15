import { readServerConfig } from "./config.js";
import { createAppServer } from "./server.js";

const { port, host, webRoot } = readServerConfig(process.env);
const server = createAppServer({ webRoot });

server.listen(port, host, () => {
  console.log(`Servidor escuchando en http://${host}:${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  server.closeAllConnections();
});
