import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      // Force all packages (including symlinked OGS packages) to use
      // trivia-jam's React instance, avoiding dual React issues
      react: path.resolve(__dirname, "node_modules/.pnpm/react@19.2.4/node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/.pnpm/react-dom@19.2.4_react@19.2.4/node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/.pnpm/react@19.2.4/node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/.pnpm/react@19.2.4/node_modules/react/jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "e2e", "**/*.e2e.spec.{js,ts}", "app/**"],
    deps: {
      inline: [/@open-game-system/],
    },
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/setup.ts"],
    },
  },
});
