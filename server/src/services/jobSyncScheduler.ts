import { syncAllSoftwareJobs } from "./greenhouseSyncService";

const DEFAULT_SYNC_INTERVAL_HOURS = 24;
let syncTimer: NodeJS.Timeout | null = null;

export const startJobSyncScheduler = (): void => {
  if (process.env.NODE_ENV === "test") return;

  const intervalHours =
    Number(process.env.JOB_SYNC_INTERVAL_HOURS) || DEFAULT_SYNC_INTERVAL_HOURS;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  const runScheduledSync = async () => {
    try {
      const result = await syncAllSoftwareJobs();
      console.log(
        `[JobSyncScheduler] Daily software job sync complete: saved=${result.totalSaved}, deactivated=${result.totalDeactivated}`,
      );
    } catch (error) {
      console.error(
        "[JobSyncScheduler] Scheduled job sync failed:",
        error instanceof Error ? error.message : error,
      );
    }
  };

  // Run an initial background sync 15 seconds after server startup if enabled
  if (process.env.ENABLE_STARTUP_JOB_SYNC !== "false") {
    setTimeout(() => {
      void runScheduledSync();
    }, 15_000).unref();
  }

  syncTimer = setInterval(() => {
    void runScheduledSync();
  }, intervalMs);
  syncTimer.unref();

  console.log(
    `[JobSyncScheduler] Scheduled software job sync every ${intervalHours}h`,
  );
};

export const stopJobSyncScheduler = (): void => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
};
