import { buildServer } from "./api/server.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  const app = buildServer();

  try {
    await app.listen({ port: env.port, host: env.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
