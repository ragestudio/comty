import type { IpcHandlers } from "../../ipc/index.js"
import type Main from "../../main.js"

export interface AppModule {
	initialize?: () => void | Promise<void>
	destroy?: () => void | Promise<void>
	ipc?: IpcHandlers
}

export interface AppModuleConstructor {
	new (main: Main): AppModule
	readonly id: string
}
