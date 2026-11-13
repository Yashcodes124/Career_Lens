/// <reference types="node" />
import path from "node:path";

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["src/__tests__/**/*.spec.ts", "node_modules", "dist"],
  },
};
