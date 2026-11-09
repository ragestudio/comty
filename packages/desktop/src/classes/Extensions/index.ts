import { Readable } from "node:stream"
import { finished } from "node:stream/promises"
import fs from "node:fs"
import path from "node:path"

import { app, ipcMain } from "electron"
import ElectronStore from "electron-store"

import type Main from "../../main.js"
import type { ApiRoute } from "../Api/types.js"

export interface ExtensionInstance {
	api?: ApiRoute[]
	ipc?: Record<string, (...args: any[]) => unknown>
	onInitialize?: () => void | Promise<void>
	onUnload?: () => void | Promise<void>
}

export interface ExtensionManifest {
	id: string
	name: string
	description?: string
	version?: string
	enabled?: boolean
	runtimed?: boolean
	url?: string
	main?: string
	remoteMain?: string
	assetsPath?: string
	backend?: string
	path?: string
	bundle?: string
	store?: ElectronStore
	instance?: ExtensionInstance
}

export interface SerializedExtension {
	id: string
	name: string
	description?: string
	version?: string
	enabled?: boolean
	runtimed?: boolean
	url?: string
	main?: string
	remoteMain?: string
	assetsPath?: string
	backend?: string
	path?: string
}

export default class ExtensionManager extends Map<string, ExtensionManifest> {
	static get extensionsPath(): string {
		return path.resolve(app.getPath("userData"), "app-extensions")
	}

	constructor(readonly main: Main) {
		super()

		fs.mkdirSync(ExtensionManager.extensionsPath, { recursive: true })
	}

	async initialize(): Promise<void> {
		if (!fs.existsSync(ExtensionManager.extensionsPath)) {
			console.warn(`Skiping loading extensions. Path not exists`)
			return
		}

		const namespaces = await fs.promises.readdir(
			ExtensionManager.extensionsPath,
		)

		for (const namespace of namespaces) {
			const extensionPath = path.resolve(
				ExtensionManager.extensionsPath,
				namespace,
			)

			if ((await fs.promises.stat(extensionPath)).isFile()) {
				continue
			}

			await this.load(namespace)
		}
	}

	async load(id: string): Promise<void> {
		const extensionPath = path.resolve(ExtensionManager.extensionsPath, id)
		const manifestPath = path.resolve(extensionPath, "manifest.json")

		if (!fs.existsSync(manifestPath)) {
			throw new Error("Extension not found")
		}

		const rawManifest = await fs.promises.readFile(manifestPath, "utf8")
		const manifest = JSON.parse(rawManifest) as ExtensionManifest

		// create some helpers
		manifest.store = new ElectronStore({
			name: `extensions-${manifest.id}`,
		})

		// if backend available load & start
		if (manifest.backend && fs.existsSync(manifest.backend)) {
			const imported = await import(manifest.backend)
			const Backend = imported.default ?? imported
			const instance = new Backend(
				this.main,
				manifest,
			) as ExtensionInstance

			manifest.instance = instance

			await instance.onInitialize?.()

			// register extension api endpoints
			if (Array.isArray(instance.api)) {
				for (const route of instance.api) {
					if (!route.path.startsWith("/")) {
						route.path = `/${route.path}`
					}

					route.path = `/api/${manifest.id}${route.path}`

					this.main.api.register(route)
				}
			}

			if (instance.ipc) {
				for (const [event, handler] of Object.entries(instance.ipc)) {
					ipcMain.handle(`${manifest.id}:${event}`, handler)
				}
			}
		}

		// send the main entry to the renderer
		if (manifest.main) {
			this.main.mainWindow?.webContents.send("extensions:load", {
				id: manifest.id,
				name: manifest.name,
				description: manifest.description,
				version: manifest.version,
				enabled: true,
				runtimed: true,
				url: manifest.url,
				main: manifest.main,
				remoteMain: manifest.remoteMain,
				assetsPath: manifest.assetsPath,
				path: manifest.path,
			})
		}

		this.set(manifest.id, manifest)
	}

	async unload(id: string): Promise<void> {
		const extension = this.get(id)

		if (!extension) {
			throw new Error("Extension not found")
		}

		if (extension.instance) {
			if (extension.instance.ipc) {
				for (const event of Object.keys(extension.instance.ipc)) {
					ipcMain.removeHandler(`${extension.id}:${event}`)
				}
			}

			await extension.instance.onUnload?.()
		}

		this.delete(id)
	}

	async install(url: string): Promise<void> {
		const manifestUrl = new URL(url)

		console.log("Installing extension from: ", manifestUrl)

		const response = await fetch(manifestUrl.href, { cache: "no-cache" })

		if (response.status !== 200) {
			throw new Error("Could not load extension manifest")
		}

		const manifest = (await response.json()) as ExtensionManifest

		if (!manifest.bundle) {
			throw new Error("Extension manifest does not contain a bundle")
		}

		manifest.id = manifest.name.replace("/", "-").replace("@", "")
		manifest.bundle = new URL(manifest.bundle, manifestUrl.origin).href
		manifest.path = path.resolve(
			ExtensionManager.extensionsPath,
			manifest.id,
		)

		console.log("Extension manifest: ", manifest)

		// check if is already loaded
		if (this.has(manifest.id)) {
			console.log("Extension already loaded, unloading...")
			await this.unload(manifest.id)
		}

		const extensionBundlePath = path.resolve(manifest.path, "bundle")

		// remove any previous installation
		if (fs.existsSync(manifest.path)) {
			await fs.promises.rm(manifest.path, {
				recursive: true,
				force: true,
			})
		}

		await fs.promises.mkdir(manifest.path, { recursive: true })

		// download bundle into manifest.path
		const bundleResponse = await fetch(manifest.bundle)

		if (!bundleResponse.ok || !bundleResponse.body) {
			throw new Error("Could not download extension bundle")
		}

		const bundleStream = Readable.fromWeb(
			bundleResponse.body as unknown as import("node:stream/web").ReadableStream,
		)

		console.log("Writing to bundle file")

		await finished(
			bundleStream.pipe(fs.createWriteStream(extensionBundlePath)),
		)

		// rename cause idk cant write with .asar extension
		await fs.promises.rename(
			extensionBundlePath,
			`${extensionBundlePath}.asar`,
		)

		// clean up
		const manifestRecord = manifest as unknown as Record<string, unknown>

		for (const key of [
			"bundle",
			"scripts",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
			"bundledDependencies",
		]) {
			delete manifestRecord[key]
		}

		manifest.runtimed = true
		manifest.enabled = true

		const assetsUrl = `http://localhost:${this.main.api.listenPort}/extensions/assets/${manifest.name}`

		manifest.url = assetsUrl

		// override paths
		manifest.assetsPath = `${extensionBundlePath}.asar`
		manifest.main = path.resolve(manifest.path, manifest.main ?? "")
		manifest.remoteMain = `${assetsUrl}/bundle.asar/${path.relative(
			manifest.path,
			manifest.main,
		)}`

		if (manifest.backend) {
			manifest.backend = path.resolve(
				manifest.assetsPath,
				manifest.backend,
			)
		}

		console.log("Writing to manifest file")

		await fs.promises.writeFile(
			path.resolve(manifest.path, "manifest.json"),
			JSON.stringify(manifest, null, 2),
		)

		console.log("Install done!", manifest)

		await this.load(manifest.id)
	}

	valuesSerialized(): SerializedExtension[] {
		return Array.from(this.values()).map((extension) => {
			return {
				id: extension.id,
				name: extension.name,
				description: extension.description,
				version: extension.version,
				enabled: extension.enabled,
				runtimed: extension.runtimed,
				url: extension.url,
				main: extension.main,
				remoteMain: extension.remoteMain,
				assetsPath: extension.assetsPath,
				backend: extension.backend,
				path: extension.path,
			}
		})
	}

	async invokeIpcCall(
		extensionId: string,
		event: string,
		...args: unknown[]
	): Promise<unknown> {
		const extension = this.get(extensionId)

		if (!extension) {
			throw new Error("Extension not found")
		}

		return await new Promise((resolve, reject) => {
			ipcMain.once(`${extensionId}:${event}:reply`, (_event, payload) => {
				console.log("Received reply", payload)

				if (payload.error) {
					return reject(payload.error)
				}

				return resolve(payload.data)
			})

			this.main.mainWindow?.webContents.send(
				`${extensionId}:${event}`,
				...args,
			)
		})
	}
}
