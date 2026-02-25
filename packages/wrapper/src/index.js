import path from "node:path"
import fs from "node:fs"

import { Server } from "linebridge"
import LiveDirectory from "live-directory"
import { isbot } from "isbot"
import { LRUCache } from "lru-cache"

import * as Setup from "./lib/setupDist"

async function updateDistApp() {
	if (fs.existsSync(WebWrapper.appDistPath)) {
		await fs.promises.rm(WebWrapper.appDistPath, { recursive: true })
	}

	await Setup.setupLatestRelease({
		repository: WebWrapper.repoName,
		distCompressedFile: WebWrapper.distCompressedFile,
		destinationPath: WebWrapper.publicPath,
		cachePath: WebWrapper.cachePath,
	})
}

class WebWrapper extends Server {
	static baseRoutes = false
	static listenPort = process.env.HTTP_LISTEN_PORT || 5000

	static publicPath = path.resolve(process.cwd(), "public")
	static appDistPath = path.resolve(process.cwd(), "public/app-release-files")
	static cachePath = path.resolve(process.cwd(), ".cache")
	static appManifestPath = path.resolve(this.publicPath, "manifest.json")
	static distCompressedFile = "dist.zip"
	static repoName = "ragestudio/comty"
	static routesPath = __dirname + "/routes"

	//static useMiddlewares = ["logs"]

	contexts = {
		lru: new LRUCache({
			max: 100,
			ttl: 1000 * 60 * 10,
		}),
		updateDistApp: updateDistApp,
		listenLiveDirectory: () => {
			this.contexts.publicFiles = new LiveDirectory(
				WebWrapper.appDistPath,
				{
					static: false,
				},
			)
		},
	}

	handleRequest = async (req, res, next) => {
		let file = this.contexts.publicFiles.get(req.path)

		if (file === undefined) {
			file = this.contexts.publicFiles.get("index.html")
			req.indexHtml = file.content
		}

		if (!file) {
			throw new OperationError(404, "File not found")
		}

		req.file = file
	}

	middlewares = {
		onlyBots: (req, res, next) => {
			if (!isbot(req.headers["user-agent"])) {
				return res.send(req.indexHtml)
			}

			console.log(req.headers["user-agent"])

			return next()
		},
	}

	async onInitialize() {
		const LOGO_PATH = path.join(__dirname, "/logo.svg")

		if (fs.existsSync(LOGO_PATH)) {
			this.contexts.logoFile = fs.readFileSync(LOGO_PATH)
		}

		if (!fs.existsSync(WebWrapper.publicPath)) {
			console.log("Creating public path...")
			fs.mkdirSync(WebWrapper.publicPath)
		}

		if (!fs.existsSync(WebWrapper.appManifestPath)) {
			console.log(`ℹ️ Missing app manifest/dist, installing...`)

			await this.contexts.updateDistApp()
		}

		let manifest = await fs.promises.readFile(
			WebWrapper.appManifestPath,
			"utf8",
		)

		manifest = JSON.parse(manifest)

		const latestRelease = await Setup.getLatestReleaseFromGithub(
			WebWrapper.repoName,
		).catch(() => null)

		if (latestRelease) {
			if (latestRelease.tag_name !== manifest.version) {
				console.log(
					`🔰 New version available: ${latestRelease.tag_name}, updating...`,
				)
				await this.contexts.updateDistApp()
			} else {
				console.log(`✅ App dist is up to date!`)
			}
		}

		this.contexts.listenLiveDirectory()
		this.engine.app.use(this.handleRequest)
	}
}

Boot(WebWrapper)
