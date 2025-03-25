import fs from "node:fs"
import path from "node:path"
import os from "node:os"

export default class Config {
	static appWorkdir = path.resolve(os.homedir(), ".comty-cli")
	static configFilePath = path.resolve(Config.appWorkdir, "config.json")

	data = {}

	async initialize() {
		if (!fs.existsSync(path.dirname(Config.configFilePath))) {
			fs.mkdirSync(path.dirname(Config.configFilePath), {
				recursive: true,
			})
		}

		if (!fs.existsSync(Config.configFilePath)) {
			fs.writeFileSync(Config.configFilePath, JSON.stringify({}))
		}

		this.data = JSON.parse(
			await fs.promises.readFile(Config.configFilePath, "utf8"),
		)
	}

	async write() {
		await fs.promises.writeFile(
			Config.configFilePath,
			JSON.stringify(this.data),
		)
	}

	get(key) {
		return this.data[key]
	}

	async set(key, value) {
		this.data[key] = value

		await this.write()

		return value
	}

	async delete(key) {
		delete this.data[key]

		await this.write()
	}
}
