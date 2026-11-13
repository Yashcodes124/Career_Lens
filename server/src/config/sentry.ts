export const initServerMonitoring = (): void => {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || process.env.NODE_ENV === "test") return;

  const sentryModule = "@sentry/node";
  import(sentryModule)
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 0.2,
      });
      console.log("[Sentry] Server error monitoring initialized");
    })
    .catch(() => {
      console.warn(
        "[Sentry] SENTRY_DSN provided, but @sentry/node is not installed yet.",
      );
    });
};

export const captureServerException = (error: unknown): void => {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || process.env.NODE_ENV === "test") return;

  const sentryModule = "@sentry/node";
  import(sentryModule)
    .then((Sentry) => {
      Sentry.captureException(error);
    })
    .catch(() => undefined);
};
