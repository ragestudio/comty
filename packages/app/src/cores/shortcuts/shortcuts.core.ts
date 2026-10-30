import Core from "@ragestudio/vessel/core"

export type KeyboardShortcut = {
	id: string
	key: string
	fn: (...args: any[]) => void

	ctrl?: boolean
	meta?: boolean
	alt?: boolean
	shift?: boolean

	preventDefault?: boolean
}

export default class ShortcutsCore extends Core {
	static namespace = "shortcuts"

	shortcuts = new Map<string, Set<KeyboardShortcut>>()

	public = {
		register: this.register,
	}

	handleKeydown = (event: KeyboardEvent) => {
		// get the shortcuts registered by event.key
		const shortcuts = this.shortcuts.get(event.key)

		if (!shortcuts) return

		// iterate every shortcut for this event.key
		for (const shortcut of shortcuts.values()) {
			if (
				typeof shortcut.ctrl === "boolean" &&
				event.ctrlKey !== shortcut.ctrl
			) {
				continue
			}

			if (
				typeof shortcut.shift === "boolean" &&
				event.shiftKey !== shortcut.shift
			) {
				continue
			}

			if (
				typeof shortcut.alt === "boolean" &&
				event.altKey !== shortcut.alt
			) {
				continue
			}

			if (
				typeof shortcut.meta === "boolean" &&
				event.metaKey !== shortcut.meta
			) {
				continue
			}

			this.console.debug("Triggering keyboard shortcut", shortcut)

			if (shortcut.preventDefault) {
				event.preventDefault()
			}

			if (typeof shortcut.fn === "function") {
				shortcut.fn()
			}
		}
	}

	async onInitialize(): Promise<void> {
		document.addEventListener("keydown", this.handleKeydown)
	}

	register(shortcut: KeyboardShortcut) {
		if (!shortcut) {
			throw new Error("`shortcut` is required")
		}

		if (typeof shortcut !== "object") {
			throw new Error("Shortcut must be an object")
		}

		if (!shortcut.fn) {
			throw new Error("`shortcut.fn` is required")
		}

		const shortcuts = this.shortcuts.get(shortcut.key) ?? new Set()

		shortcuts.add(shortcut)

		this.shortcuts.set(shortcut.key, shortcuts)
	}

	remove(shortcut: KeyboardShortcut) {
		const shortcuts = this.shortcuts.get(shortcut.key)

		if (!shortcuts) {
			return
		}

		shortcuts.delete(shortcut)

		this.shortcuts.set(shortcut.key, shortcuts)
	}
}
