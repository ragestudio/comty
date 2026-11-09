import { pathToFileURL } from "node:url"

import type Main from "../../main.js"

import type { AppModule, AppModuleConstructor } from "./types.js"

export class ModulesManager extends Map<string, AppModule> {
	constructor(private readonly main: Main) {
		super()
	}

	async loadModule(modulePath: string): Promise<AppModule> {
		console.log("[app] Loading module:", modulePath)

		const imported = await import(pathToFileURL(modulePath).href)
		const ModuleClass = (imported.default ??
			imported) as AppModuleConstructor

		const id = ModuleClass.id

		if (!id) {
			throw new Error(`Module ${modulePath} does not expose an id`)
		}

		const instance = new ModuleClass(this.main)

		await instance.initialize?.()

		for (const [event, handler] of Object.entries(instance.ipc ?? {})) {
			this.main.registerIpcHandler(this.ipcChannel(id, event), handler)
		}

		this.set(id, instance)
		console.log(`[app] Loaded module ${id}`)

		return instance
	}

	async unloadModule(id: string): Promise<void> {
		const instance = this.get(id)

		if (!instance) {
			console.error(`[app] Module ${id} is not loaded`)
			return
		}

		for (const event of Object.keys(instance.ipc ?? {})) {
			this.main.unregisterIpcHandler(this.ipcChannel(id, event))
		}

		await instance.destroy?.()

		this.delete(id)
		console.log(`[app] Unloaded module ${id}`)
	}

	async unloadAllModules(): Promise<void> {
		for (const id of this.keys()) {
			await this.unloadModule(id)
		}
	}

	private ipcChannel(id: string, event: string): string {
		return `module:${id}:${event}`
	}
}

export default ModulesManager
