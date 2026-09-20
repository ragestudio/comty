interface CoresManager {
	[key: string]: any
}

type EventBus = {
	emit(event: string, ...args: any[]): void
	on(event: string, listener: (...args: any[]) => void): void
	off(event: string, listener: (...args: any[]) => void): void
}

export {}
