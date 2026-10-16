import type { Plugin } from "vite"

import fs from "fs"
import path from "path"
import stripJsonComments from "strip-json-comments"

const tsconfigCache = new Map<string, { dir: string; config: any } | null>()

const parseTsconfig = (file: string) => {
	try {
		return JSON.parse(stripJsonComments(fs.readFileSync(file, "utf8")))
	} catch {
		return null
	}
}

const findTsconfig = (dir: string): { dir: string; config: any } | null => {
	if (tsconfigCache.has(dir)) return tsconfigCache.get(dir)!

	let result = null

	for (const file of ["tsconfig.json", "jsconfig.json"]) {
		const full = path.join(dir, file)

		if (fs.existsSync(full)) {
			const config = parseTsconfig(full)
			if (config) {
				result = { dir, config }
				break
			}
		}
	}

	if (!result) {
		const parent = path.dirname(dir)
		if (parent !== dir) result = findTsconfig(parent)
	}

	tsconfigCache.set(dir, result)
	return result
}

export default {
	name: "comty:tsconfig-paths",
	resolveId: {
		order: "pre",
		async handler(source, importer) {
			if (!importer) return null
			if (source !== "@" && !source.startsWith("@/")) return null
			if (importer.includes(`${path.sep}node_modules${path.sep}`))
				return null

			const found = findTsconfig(path.dirname(importer))
			if (!found) return null

			const options = found.config.compilerOptions || {}
			const targets = options.paths?.["@/*"]

			if (!Array.isArray(targets)) return null

			const baseDir = options.baseUrl
				? path.resolve(found.dir, options.baseUrl)
				: found.dir
			const star = source === "@" ? "" : source.slice(2)

			for (const target of targets) {
				if (typeof target !== "string") continue

				const candidate = path.resolve(
					baseDir,
					target.replace("*", star),
				)
				const resolved = await this.resolve(candidate, importer, {
					skipSelf: true,
				})

				if (resolved) return resolved
			}

			return null
		},
	},
} satisfies Plugin
