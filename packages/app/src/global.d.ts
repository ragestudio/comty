declare global {
	interface Window {
		ipcRenderer: Electron.IpcRenderer
		app: app
	}

	export const app: App

	interface App {
		eventBus: EventBus
		cores: CoresManager
		userData: null | Object<string, any>
		isDesktop: boolean
	}

	interface CoresManager {
		[key: string]: any
	}
}

type EventBus = {
	emit(event: string, ...args: any[]): void
	on(event: string, listener: (...args: any[]) => void): void
	off(event: string, listener: (...args: any[]) => void): void
}

export {}
