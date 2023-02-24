import Core from "evite/src/core"

export default class ShortcutsCore extends Core {
    shortcutsRegister = []

    registerToApp = {
        shortcuts: this
    }

    handleEvent = (event, shortcut, fn) => {
        if (typeof shortcut !== "object") {
            throw new Error("Shortcut must be an object")
        }

        // check the event key pressed
        if (event.key !== shortcut.key) {
            return
        }

        if (typeof shortcut.ctrl === "boolean" && event.ctrlKey !== shortcut.ctrl) {
            return
        }

        if (typeof shortcut.shift === "boolean" && event.shiftKey !== shortcut.shift) {
            return
        }

        if (typeof shortcut.alt === "boolean" && event.altKey !== shortcut.alt) {
            return
        }

        if (typeof shortcut.meta === "boolean" && event.metaKey !== shortcut.meta) {
            return
        }

        if (shortcut.preventDefault) {
            event.preventDefault()
        }

        if (typeof fn === "function") {
            fn()
        }
    }

    register = (shortcut, fn) => {
        if (!shortcut) {
            throw new Error("`shortcut` is required")
        }

        if (typeof shortcut !== "object") {
            throw new Error("Shortcut must be an object")
        }

        if (!fn) {
            throw new Error("`fn` is required")
        }

        const handler = (event) => this.handleEvent(event, shortcut, fn)

        this.shortcutsRegister.push({
            id: shortcut.id,
            handler: handler
        })

        return document.addEventListener("keydown", handler)
    }

    remove = (id) => {
        if (!id) {
            throw new Error("`id` is required")
        }

        if (typeof id !== "string") {
            throw new Error("`id` must be a string")
        }

        // search the event handler
        const register = this.shortcutsRegister.find((handler) => handler.id === id)

        if (!register) {
            console.warn(`Shortcut with id "${id}" not found`)
            return false
        }

        // remove the event handler
        document.removeEventListener("keydown", register.handler)

        // remove the event handler from the list
        this.shortcutsRegister = this.shortcutsRegister.filter((handler) => handler.id !== id)
    }

    window = {
        ShortcutsController: this
    }
}