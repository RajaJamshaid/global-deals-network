import { buildServer } from "./api/server.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  const app = buildServer();

  // Never log the key itself - only whether it is usable.
  if (env.internalApiKeyStatus === "missing") {
    app.log.warn(
      "GDN_INTERNAL_API_KEY is not set: all protected write requests (POST/PATCH/PUT/DELETE) will be rejected with 401",
    );
  } else if (env.internalApiKeyStatus === "too_short") {
    app.log.warn(
      `GDN_INTERNAL_API_KEY is shorter than ${env.internalApiKeyMinLength} characters and is ignored: all protected write requests will be rejected with 401`,
    );
  }

  try {
    await app.listen({ port: env.port, host: env.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
