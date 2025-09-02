import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      globals: true,
      root: process.cwd(),
      include: ["src/**/*.spec.ts"],
      coverage: {
        reporter: ["text", "json-summary", "json", "html"],
        reportOnFailure: true,
        include: ["src/components/*.vue"],
        reportsDirectory: "../coverage",
      },
    },
  })
);
