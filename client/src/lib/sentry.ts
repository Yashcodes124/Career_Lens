export const initClientMonitoring = (): void => {
  const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();
  if (!dsn || import.meta.env.MODE === "test") return;

  // Dynamic import keeps bundle & dev working even before @sentry/react is installed
  const moduleName = "@sentry/react";
  import(/* @vite-ignore */ moduleName)
    .then((Sentry: any) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.2,
      });
    })
    .catch(() => undefined);
};
