import { prisma } from "../src/config/db";
import { syncAllSoftwareJobs } from "../src/services/greenhouseSyncService";

async function main() {
  console.log(
    "[Seed] Syncing verified India & global software engineering jobs...",
  );
  const result = await syncAllSoftwareJobs();
  console.log(
    `[Seed] Complete: totalSaved=${result.totalSaved}, deactivatedExcluded=${result.totalDeactivated}`,
  );
}

main()
  .catch((err) => {
    console.error("[Seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
