import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        pool: "forks",
        setupFiles: ["./tests/setup.ts"]
    }
});