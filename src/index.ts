import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDb();

  const server = createApp().listen(env.PORT, () => {
    console.log(`[api] ${env.FROM_NAME} listening on ${env.baseUrl} (${env.NODE_ENV})`);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      server.close(async () => {
        await disconnectDb();
        process.exit(0);
      });
    });
  }
}

main().catch((err) => {
  console.error("[api] failed to start", err);
  process.exit(1);
});
