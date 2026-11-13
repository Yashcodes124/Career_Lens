import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { initServerMonitoring } from "./config/sentry";
import {
  startJobSyncScheduler,
  stopJobSyncScheduler,
} from "./services/jobSyncScheduler";

initServerMonitoring();

const server = app.listen(env.PORT, () => {
  console.log(
    `[TrueHire API] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`,
  );
  startJobSyncScheduler();
});

const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down TrueHire server gracefully...`);
  stopJobSyncScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
