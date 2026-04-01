import app from "./app";
import { logger } from "./lib/logger";
import { seedAdmin } from "./lib/seed";
import { runMigrations } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await runMigrations().then(() => {
    logger.info("Database migrations applied");
  }).catch(err => {
    logger.warn({ err }, "Migration warning (non-fatal, tables may already exist)");
  });

  await seedAdmin().catch(err => logger.warn({ err }, "Admin seed failed (non-fatal)"));

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start().catch(err => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
