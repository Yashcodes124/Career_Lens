import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { initServerMonitoring } from "./config/sentry";
import {
  startJobSyncScheduler,
  stopJobSyncScheduler,
} from "./services/jobSyncScheduler";
import {hydrateOntologyFromDatabase} from "./services/matching/skillDictionary";

initServerMonitoring();

const server = app.listen(env.PORT, () => {
  console.log(
    `[TrueHire API] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`,
  );
  void hydrateOntologyFromDatabase()
    .then(
      ({ approvedLoaded, rejectedLoaded }: { approvedLoaded: number; rejectedLoaded: number }) => {
      if (approvedLoaded > 0 || rejectedLoaded > 0) {
        console.log(
          `[Ontology] Hydrated ${approvedLoaded} approved aliases and ${rejectedLoaded} dismissed tokens from DB.`,
        );
      }
      },
    )
    .catch(() => null);
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
