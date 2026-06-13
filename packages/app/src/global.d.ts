interface CoresManager {
	[key: string]: any
}

type EventBus = {
	emit(event: string, ...args: any[]): void
	on(event: string, listener: (...args: any[]) => void): void
	off(event: string, listener: (...args: any[]) => void): void
}

interface app {
	eventBus: EventBus
	cores: CoresManager
	userData: null | Record<string, any>
	isDesktop: boolean
	[key: string]: any
}

declare global {
	interface Window {
		ipcRenderer: Electron.IpcRenderer
		app: app
	}

	const app: app
}

export {}
