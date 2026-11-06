import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    pool: "forks",
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      JWT_SECRET: "test-only-secret-that-is-at-least-32-characters-long",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
