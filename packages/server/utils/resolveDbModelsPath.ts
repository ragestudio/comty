import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

export default function (): string {
	return path.resolve(
		path.dirname(require.resolve("@comty/shared/package.json")),
		"db",
	)
}
