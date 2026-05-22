import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		setupFiles: [],
		testTimeout: 30000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["**/*.{ts,js}"],
			exclude: ["**/node_modules/**", "**/*.test.{ts,js}", "**/dist/**"],
		},
	},
	resolve: {
		alias: {
			"^@shared-classes/Scylla$": path.resolve(
				__dirname,
				"classes/Scylla/index.ts",
			),
			"^@shared-classes/Scylla/(.*)$": path.resolve(
				__dirname,
				"classes/Scylla/$1",
			),
		},
	},
})
