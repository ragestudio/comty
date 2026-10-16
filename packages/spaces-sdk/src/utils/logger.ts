// log levels, ordered from the least to the most verbose one
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug"

export type LoggerMethod = "log" | "debug" | "info" | "warn" | "error"

// anything able to receive the log calls, defaults to the console
export interface LoggerSink {
	log(...args: any[]): void
	debug(...args: any[]): void
	info(...args: any[]): void
	warn(...args: any[]): void
	error(...args: any[]): void
}

export interface LoggerOptions {
	level?: LogLevel
	sink?: LoggerSink
	namespace?: string
	colors?: boolean
}

const LEVEL_RANK: Record<LogLevel, number> = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
}

// log and info share the same verbosity tier
const METHOD_RANK: Record<LoggerMethod, number> = {
	error: 1,
	warn: 2,
	info: 3,
	log: 3,
	debug: 4,
}

// one color per namespace slot, the namespace is hashed into this list
const NAMESPACE_COLORS = [
	{ css: "#e06c75", ansi: 204 },
	{ css: "#d19a66", ansi: 180 },
	{ css: "#e5c07b", ansi: 186 },
	{ css: "#98c379", ansi: 150 },
	{ css: "#56b6c2", ansi: 80 },
	{ css: "#61afef", ansi: 75 },
	{ css: "#c678dd", ansi: 176 },
	{ css: "#e06c9f", ansi: 211 },
]

// css applied on top of the namespace color, to render it as a badge
const BADGE_STYLE = "color: #1e1e1e; padding: 1px 6px; border-radius: 4px"

function isBrowser() {
	return typeof window !== "undefined" && typeof document !== "undefined"
}

// stable color for a namespace, so a given tag always looks the same
function colorFor(namespace: string) {
	let hash = 0

	for (let i = 0; i < namespace.length; i++) {
		hash = (hash * 31 + namespace.charCodeAt(i)) >>> 0
	}

	return NAMESPACE_COLORS[hash % NAMESPACE_COLORS.length]
}

// small agnostic logger, it forwards every call to a pluggable sink and
// filters them by level, host apps can replace both at runtime
export class Logger {
	private namespace?: string
	private parent?: Logger
	private level: LogLevel
	private sink: LoggerSink
	private colors: boolean

	constructor(options: LoggerOptions = {}, parent?: Logger) {
		this.level = options.level ?? "debug"
		this.sink = options.sink ?? console
		this.namespace = options.namespace
		this.colors = options.colors ?? true
		this.parent = parent
	}

	// bound methods, so they can be passed around directly (e.g. .catch(logger.error))
	log = (...args: any[]) => this.write("log", args)
	debug = (...args: any[]) => this.write("debug", args)
	info = (...args: any[]) => this.write("info", args)
	warn = (...args: any[]) => this.write("warn", args)
	error = (...args: any[]) => this.write("error", args)

	setLevel(level: LogLevel) {
		this.root.level = level
	}

	setSink(sink: LoggerSink) {
		this.root.sink = sink
	}

	// enable or disable the namespace colors
	setColors(enabled: boolean) {
		this.root.colors = enabled
	}

	// create a namespaced logger sharing the root level and sink
	child(namespace: string): Logger {
		const name = this.namespace
			? `${this.namespace}:${namespace}`
			: namespace

		return new Logger({ namespace: name }, this.root)
	}

	private get root(): Logger {
		return this.parent ? this.parent.root : this
	}

	private write(method: LoggerMethod, args: any[]) {
		const root = this.root

		if (METHOD_RANK[method] > LEVEL_RANK[root.level]) return

		const sink = root.sink
		const target = sink[method] ?? sink.log
		const tag = this.formatTag()

		if (!tag) {
			target.call(sink, ...args)
			return
		}

		target.call(sink, ...tag, ...args)
	}

	// build the namespace tag, styled when colors are enabled, otherwise null
	// so the caller can skip the prefix entirely
	private formatTag(): any[] | null {
		if (!this.namespace) return null

		const label = `[${this.namespace}]`

		if (!this.root.colors) return [label]

		const color = colorFor(this.namespace)

		// browsers render css through the %c directive, node uses ansi codes
		if (isBrowser()) {
			return [`%c${label}`, `background: ${color.css}; ${BADGE_STYLE}`]
		}

		return [`\x1b[48;5;${color.ansi}m\x1b[30m ${label} \x1b[0m`]
	}
}

// root logger used across the sdk
export const logger = new Logger()

// create a namespaced logger from the root one
export function createLogger(namespace: string) {
	return logger.child(namespace)
}

export default logger
