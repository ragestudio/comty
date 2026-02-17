import { Readable } from "node:stream"
import { finished } from "node:stream/promises"
import { ipcMain } from "electron"

import fs from "node:fs"
import path from "node:path"
import { app } from "electron"

import ElectronStore from "electron-store"

export default class ExtensionManager extends Map {
	constructor(main) {
		super()

		this.main = main

		if (!fs.existsSync(ExtensionManager.extensionsPath)) {
			fs.mkdirSync(ExtensionManager.extensionsPath)
		}
	}

	static extensionsPath = path.resolve(
		app.getPath("userData"),
		"app-extensions",
	)

	store = new ElectronStore({
		name: "extensions",
		defaults: {},
	})

	initialize = async () => {
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

			this.load(namespace)
		}
	}

	load = async (id) => {
		const extensionPath = path.resolve(ExtensionManager.extensionsPath, id)
		const manifestPath = path.resolve(extensionPath, "manifest.json")

		if (!fs.existsSync(manifestPath)) {
			throw new Error("Extension not found")
		}

		// read & parse
		let manifest = await fs.promises.readFile(manifestPath, "utf8")

		manifest = JSON.parse(manifest)

		// create some helpers
		manifest.store = new ElectronStore({
			name: `extensions-${manifest.id}`,
		})

		console.log("Manifest: ", manifest)

		// if backend available load & start
		if (manifest.backend) {
			if (fs.existsSync(manifest.backend)) {
				manifest.backend = await import(manifest.backend)
				manifest.backend = manifest.backend.default ?? manifest.backend
				manifest.instance = new manifest.backend(this.main, manifest)

				if (typeof manifest.instance.onInitialize === "function") {
					await manifest.instance.onInitialize()
				}

				// register extension api endpoints
				if (Array.isArray(manifest.instance.api)) {
					for (let route of manifest.instance.api) {
						if (!route.path.startsWith("/")) {
							route.path = `/${route.path}`
						}

						route.path = `/api/${manifest.id}${route.path}`

						this.main.api.register(route)
					}
				}

				if (typeof manifest.instance.ipc === "object") {
					for (let [event, handler] of Object.entries(
						manifest.instance.ipc,
					)) {
						ipcMain.handle(`${manifest.id}:${event}`, handler)
					}
				}
			}
		}

		// if main available send to load to renderer
		if (manifest.main) {
			console.log("Sending to renderer")
			this.main.mainWindow.webContents.send("extensions:load", {
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

		// set the extension
		this.set(manifest.id, manifest)
	}

	unload = async (id) => {
		const extension = this.get(id)

		if (!extension) {
			throw new Error("Extension not found")
		}

		if (extension.instance) {
			// unregister ipc event
			if (typeof extension.instance.ipc === "object") {
				for (let [event, handler] of Object.entries(
					extension.instance.ipc,
				)) {
					ipcMain.removeHandler(`${extension.id}:${event}`)
				}
			}

			if (typeof extension.instance.onUnload === "function") {
				await extension.instance.onUnload()
			}
		}

		this.delete(id)
	}

	install = async (url) => {
		url = new URL(url)

		console.log("Installing extension from: ", url)

		let manifest = await fetch(url.href, { cache: "no-cache" })

		if (manifest.status !== 200) {
			throw new Error("Could not load extension manifest")
		}

		manifest = await manifest.json()

		if (!manifest.bundle) {
			throw new Error("Extension manifest does not contain a bundle")
		}

		manifest.id = manifest.name.replace("/", "-").replace("@", "")
		manifest.bundle = new URL(manifest.bundle, url.origin)
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

		let extensionBundlePath = path.resolve(manifest.path, "bundle")

		if (fs.existsSync(extensionBundlePath + ".asar")) {
			await fs.promises.unlink(extensionBundlePath + ".asar", {
				recursive: true,
				force: true,
			})
		}

		// if exist, delete it
		if (fs.existsSync(manifest.path)) {
			await fs.promises.rm(manifest.path, {
				recursive: true,
				force: true,
			})
		}

		// create the directory
		await fs.promises.mkdir(manifest.path, { recursive: true })

		// download bundle into manifest.path
		let bundleResponse = await fetch(manifest.bundle.href)

		if (!bundleResponse.ok || !bundleResponse.body) {
			throw new Error("Could not download extension bundle")
		}

		bundleResponse = Readable.fromWeb(bundleResponse.body)

		console.log("Writing to bundle file")

		await finished(
			bundleResponse.pipe(fs.createWriteStream(extensionBundlePath)),
		)

		// rename cause idk cant write with .asar extension
		await fs.promises.rename(
			extensionBundlePath,
			extensionBundlePath + ".asar",
		)

		// clean up
		delete manifest.bundle
		delete manifest.scripts
		delete manifest.devDependencies
		delete manifest.peerDependencies
		delete manifest.optionalDependencies
		delete manifest.bundledDependencies

		manifest.runtimed = true
		manifest.enabled = true

		manifest.url = `http://localhost:${this.main.api.constructor.listenPort}/extensions/assets/${manifest.name}`

		// override paths
		manifest.assetsPath = extensionBundlePath + ".asar"
		manifest.main = path.resolve(manifest.path, manifest.main)
		manifest.remoteMain = `http://localhost:${this.main.api.constructor.listenPort}/extensions/assets/${manifest.name}/bundle.asar/${path.relative(manifest.path, manifest.main)}`

		if (manifest.backend) {
			manifest.backend = path.resolve(
				manifest.assetsPath,
				manifest.backend,
			)
		}

		console.log("Writing to manifest file")

		// create the manfiest file
		await fs.promises.writeFile(
			path.resolve(manifest.path, "manifest.json"),
			JSON.stringify(manifest, null, 2),
		)

		console.log("Install done!", manifest)

		this.load(manifest.id)
	}

	valuesSerialized = () => {
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

	invokeIpcCall = async (extensionId, event, ...args) => {
		// check if extension is loaded
		const extension = this.get(extensionId)

		if (!extension) {
			throw new Error("Extension not found")
		}

		return await new Promise((resolve, reject) => {
			ipcMain.once(`${extensionId}:${event}:reply`, (event, payload) => {
				console.log("Received reply", payload)
				if (payload.error) {
					return reject(payload.error)
				}

				return resolve(payload.data)
			})

			this.main.mainWindow.webContents.send(
				`${extensionId}:${event}`,
				...args,
			)
		})
	}
}
