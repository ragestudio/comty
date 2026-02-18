import { Server } from "linebridge"
import LiveDirectory from "live-directory"
import * as Setup from "./lib/setupDist"

import crypto from "node:crypto"
import path from "node:path"
import fs from "node:fs"

class WebWrapper extends Server {
	static baseRoutes = false
	static listenPort = process.env.HTTP_LISTEN_PORT || 5000

	static publicPath = path.resolve(process.cwd(), "public")
	static appDistPath = path.resolve(process.cwd(), "public/app-release-files")
	static cachePath = path.resolve(process.cwd(), ".cache")
	static appManifestPath = path.resolve(this.publicPath, "manifest.json")
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

	async updateDistApp() {
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

	async handleUpdateWebhook(req, res) {
		const bodyBuff = await req.buffer()

		const requestSignature = Buffer.from(
			req.headers["x-hub-signature-256"] || "",
			"utf8",
		)
		const hmac = crypto.createHmac(
			"sha256",
			process.env.WRAPPER_AUTO_UPDATE_KEY,
		)
		const digest = Buffer.from(
			"sha256" + "=" + hmac.update(bodyBuff).digest("hex"),
			"utf8",
		)

		// if signatures not match, return error
		if (
			requestSignature.length !== digest.length ||
			!crypto.timingSafeEqual(digest, requestSignature)
		) {
			return res.status(401).json({ error: "Invalid signature" })
		}

		if (req.body.action !== "published") {
			return res.status(400).json({ error: "Invalid action" })
		}

		// return ok and schedule update for the 30 seconds
		console.log("[WEBHOOK] Update app dist triggered >", {
			sig: req.headers["x-hub-signature-256"],
		})

		res.status(200).json({ ok: true })

		setTimeout(async () => {
			await this.updateDistApp()
			await this.listenLiveDirectory()
		}, 30000)
	}

	async listenLiveDirectory() {
		global.staticLiveDirectory = new LiveDirectory(WebWrapper.appDistPath, {
			static: false,
		})
	}

	async onInitialize() {
		if (process.env.WRAPPER_AUTO_UPDATE_KEY) {
			console.log("Auto update key is set, enabling webhook update")

			this.register.http({
				method: "POST",
				route: "/webhooks/update",
				fn: this.handleUpdateWebhook.bind(this),
			})
		}

		if (!fs.existsSync(WebWrapper.publicPath)) {
			console.log("Creating public path...")
			fs.mkdirSync(WebWrapper.publicPath)
		}

		if (!fs.existsSync(WebWrapper.appManifestPath)) {
			console.log(`ℹ️ Missing app manifest/dist, installing...`)

			await this.updateDistApp()
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
				await this.updateDistApp()
			} else {
				console.log(`✅ App dist is up to date!`)
			}
		}

		await this.listenLiveDirectory()
	}
}

Boot(WebWrapper)
