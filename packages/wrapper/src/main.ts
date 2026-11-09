import path from "node:path"
import fs from "node:fs"

import { Server, type MiddlewareHandlerFunction } from "linebridge"
import LiveDirectory from "live-directory"
import { isbot } from "isbot"
import { LRUCache } from "lru-cache"

import {
	readReleaseManifest,
	setupLatestRelease,
	type ReleaseManifest,
} from "./lib/setupDist"
import {
	DEFAULT_DIST_ASSET_NAME,
	DEFAULT_RELEASE_TAG_PREFIX,
	getLatestReleaseWithAsset,
	type ReleaseWithAsset,
} from "./lib/releases"
import type { WrapperRequest } from "./types"

export default class WebWrapper extends Server {
	static baseRoutes = false
	static listenPort = process.env.HTTP_LISTEN_PORT || 5000

	static publicPath = path.resolve(process.cwd(), "public")
	static appDistPath = path.resolve(process.cwd(), "public/app-release-files")
	static cachePath = path.resolve(process.cwd(), ".cache")
	static appManifestPath = path.resolve(this.publicPath, "manifest.json")
	static distAssetName = DEFAULT_DIST_ASSET_NAME
	static releaseTagPrefix = DEFAULT_RELEASE_TAG_PREFIX
	static repository = "ragestudio/comty"
	static routesPath = path.join(import.meta.dirname, "routes")

	private publicFiles: LiveDirectory | null = null
	private installPromise: Promise<void> | null = null

	lru = new LRUCache<string, any>({
		max: 100,
		ttl: 1000 * 60 * 10,
	})

	contexts = {
		lru: this.lru,
		logoFile: null as Buffer | null,
		updateDistApp: (release?: ReleaseWithAsset) =>
			this.updateDistApp(release),
		listenLiveDirectory: () => this.listenLiveDirectory(),
	}

	handleRequest: MiddlewareHandlerFunction = async (req, res, next) => {
		const request = req as WrapperRequest<WebWrapper>
		const directory = this.publicFiles

		if (!directory) {
			throw new OperationError(503, "App dist is not available")
		}

		const file = directory.get(request.path)

		if (file) {
			request.file = file

			return next()
		}

		const indexFile = directory.get("index.html")

		if (!indexFile) {
			throw new OperationError(503, "index.html is not available")
		}

		request.file = indexFile
		request.indexHtml = Buffer.isBuffer(indexFile.content)
			? indexFile.content.toString("utf8")
			: await fs.promises.readFile(indexFile.path, "utf8")

		return next()
	}

	middlewares = {
		onlyBots: ((req, res, next) => {
			const userAgent = req.headers["user-agent"]

			if (!isbot(userAgent)) {
				const request = req as WrapperRequest<WebWrapper>

				return res.send(request.indexHtml ?? "")
			}

			console.log(userAgent)

			return next()
		}) satisfies MiddlewareHandlerFunction,
	}

	async updateDistApp(release?: ReleaseWithAsset): Promise<void> {
		if (this.installPromise) {
			return this.installPromise
		}

		this.installPromise = setupLatestRelease(
			{
				repository: WebWrapper.repository,
				assetName: WebWrapper.distAssetName,
				tagPrefix: WebWrapper.releaseTagPrefix,
				destinationPath: WebWrapper.publicPath,
				cachePath: WebWrapper.cachePath,
				distDirectoryName: path.basename(WebWrapper.appDistPath),
			},
			release,
		)
			.then(() => undefined)
			.finally(() => {
				this.installPromise = null
			})

		return this.installPromise
	}

	async listenLiveDirectory(): Promise<void> {
		if (!fs.existsSync(WebWrapper.appDistPath)) {
			throw new Error(
				`App dist path does not exist: ${WebWrapper.appDistPath}`,
			)
		}

		this.publicFiles?.destory()

		const directory = new LiveDirectory(WebWrapper.appDistPath, {
			static: false,
			cache: {
				max_file_count: 2048,
				max_file_size: 32 * 1024 * 1024,
			},
		})

		await new Promise<void>((resolve) => directory.once("ready", resolve))

		this.publicFiles = directory
	}

	async onInitialize() {
		const logoPath = path.join(import.meta.dirname, "logo.svg")

		if (fs.existsSync(logoPath)) {
			this.contexts.logoFile = await fs.promises.readFile(logoPath)
		}

		await fs.promises.mkdir(WebWrapper.publicPath, { recursive: true })

		const manifest = await readReleaseManifest(WebWrapper.appManifestPath)
		const distInstalled = fs.existsSync(WebWrapper.appDistPath)

		if (!manifest || !distInstalled) {
			console.log("ℹ️ Missing app dist, installing latest release...")

			await this.updateDistApp()
		} else {
			await this.checkForUpdates(manifest)
		}

		await this.listenLiveDirectory()

		this.engine.register_middleware(this.handleRequest)
	}

	private async checkForUpdates(manifest: ReleaseManifest) {
		const latestRelease = await getLatestReleaseWithAsset({
			repository: WebWrapper.repository,
			assetName: WebWrapper.distAssetName,
			tagPrefix: WebWrapper.releaseTagPrefix,
		}).catch((error) => {
			console.error("Failed to check latest release:", error)

			return null
		})

		if (!latestRelease) {
			console.log(
				`ℹ️ Could not check for updates, using installed version ${manifest.version}`,
			)

			return
		}

		if (latestRelease.release.tag_name === manifest.version) {
			console.log(`✅ App dist is up to date (${manifest.version})`)

			return
		}

		console.log(
			`🔰 New version available: ${latestRelease.release.tag_name} (installed: ${manifest.version}), updating...`,
		)

		try {
			await this.updateDistApp(latestRelease)
		} catch (error) {
			console.error(
				`Failed to update app dist, keeping version ${manifest.version}:`,
				error,
			)
		}
	}
}
