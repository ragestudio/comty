import { Server } from "linebridge"
import LiveDirectory from "live-directory"
import * as Setup from "./lib/setupDist"

import path from "node:path"
import fs from "node:fs"

class WebWrapper extends Server {
	static disableBaseEndpoints = true
	static listenPort = process.env.HTTP_LISTEN_PORT || 9999

	static publicPath = path.resolve(process.cwd(), "public")
	static cachePath = path.resolve(process.cwd(), ".cache")
	static distManifestPath = path.resolve(this.publicPath, "manifest.json")
	static distCompressedFile = "dist.zip"
	static repoName = "ragestudio/comty"

	routes = {
		"/*": {
			method: "get",
			fn: async (req, res) => {
				let file = global.staticLiveDirectory.get(req.path)

				if (file === undefined) {
					file = global.staticLiveDirectory.get("index.html")
				}

				if (file === undefined) {
					return res.status(404).json({ error: "Not found" })
				}

				const fileParts = file.path.split(".")
				const extension = fileParts[fileParts.length - 1]

				let content = file.content

				if (!content) {
					content = file.stream()
				}

				if (!content) {
					return res
						.status(500)
						.json({ error: "Cannot read this file" })
				}

				if (content instanceof Buffer) {
					return res.type(extension).send(content)
				} else {
					return res.type(extension).stream(content)
				}
			},
		},
	}

	async onInitialize() {
		if (!fs.existsSync(WebWrapper.publicPath)) {
			console.log("WebWrapper public path does not exist, creating...")
			fs.mkdirSync(WebWrapper.publicPath)
		}

		if (!fs.existsSync(WebWrapper.distManifestPath)) {
			console.log(`App dist manifest does not exist, setting up...`)

			await Setup.setupLatestRelease({
				repository: WebWrapper.repoName,
				distCompressedFile: WebWrapper.distCompressedFile,
				destinationPath: WebWrapper.publicPath,
				cachePath: WebWrapper.cachePath,
			})
		}

		global.staticLiveDirectory = new LiveDirectory(WebWrapper.publicPath, {
			static: true,
		})
	}
}

Boot(WebWrapper)
