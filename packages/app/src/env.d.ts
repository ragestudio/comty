declare global {
	interface CoresManager {
		[key: string]: any
	}

	type EventBus = {
		emit(event: string, ...args: any[]): void
		on(event: string, listener: (...args: any[]) => void): void
		off(event: string, listener: (...args: any[]) => void): void
	}

	type AppChannel = "stable" | "indev"

	interface ElectronBridge {
		desktop: true
		settings: {
			path: string
			get: (key: string) => unknown
			set: (key: string, value: unknown) => void
			delete: (key: string) => void
			clear: () => void
		}
		channel: {
			get: () => Promise<AppChannel>
			set: (channel: AppChannel) => Promise<AppChannel>
		}
		versions: {
			app: string
			build: string
			electron: string
			sysaudio: string
		}
		restart: () => Promise<unknown>
		extensions: () => Promise<unknown>
	}

	interface Window {
		ipcRenderer?: any
		_hacks: any
		__ELECTRON__?: ElectronBridge
	}
}

// allow css custom properties in inline styles
declare module "react" {
	interface CSSProperties {
		[key: `--${string}`]: string | number | undefined
	}
}

declare module "*.less" {
	const content: any
	export default content
}

declare module "*?raw" {
	const content: any
	export default content
}

declare module "*?worker" {
	const content: any
	export default content
}
declare module "*?worker&url" {
	const content: any
	export default content
}

declare module "*.css" {
	const content: any
	export default content
}

export {}
