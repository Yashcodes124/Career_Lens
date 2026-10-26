import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

const server = app.listen(env.PORT, () => {
  console.log(
    `[TrueHire API] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`,
  );
});

const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down TrueHire server gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
