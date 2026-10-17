declare global {
	interface CoresManager {
		[key: string]: any
	}

	type EventBus = {
		emit(event: string, ...args: any[]): void
		on(event: string, listener: (...args: any[]) => void): void
		off(event: string, listener: (...args: any[]) => void): void
	}

	interface Window {
		ipcRenderer: any
		_hacks: any
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
