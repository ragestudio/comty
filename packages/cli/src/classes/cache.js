import path from "node:path"
import fs from "node:fs"

import Config from "./config.js"

export default class Cache {
	static cachePath = path.resolve(Config.appWorkdir, "cache")

	static async initialize() {
		if (!fs.existsSync(this.cachePath)) {
			await fs.promises.mkdir(this.cachePath, { recursive: true })
		}
	}

	static async destroyTemporalDir(tempDirId) {
		const tempDir = path.resolve(this.cachePath, tempDirId)

		await fs.promises.rm(tempDir, {
			recursive: true,
		})
	}

	static async createTemporalDir() {
		const tempDir = path.join(this.cachePath, `temp-${Date.now()}`)

		await fs.promises.mkdir(tempDir, { recursive: true })

		return [tempDir, async () => await Cache.destroyTemporalDir(tempDir)]
	}
}
