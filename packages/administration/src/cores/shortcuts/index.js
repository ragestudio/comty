import Core from "evite/src/core"

export default class ShortcutsCore extends Core {
    shortcuts = {}

    publicMethods = {
        shortcuts: this
    }

    initialize() {
        document.addEventListener("keydown", this.handleEvent)
    }

    handleEvent = (event) => {
        // FIXME: event.key sometimes is not defined
        //event.key = event.key.toLowerCase()

        const shortcut = this.shortcuts[event.key]

        if (shortcut) {
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

            if (typeof shortcut.fn === "function") {
                shortcut.fn()
            }
        }
    }

    register = (keybind = {}, fn) => {
        if (typeof keybind === "string") {
            keybind = {
                key: keybind,
            }
        }


        this.shortcuts[keybind.key] = {
            ...keybind,
            fn,
        }
    }

    remove = (array) => {
        if (typeof array === "string") {
            array = [array]
        }

        array.forEach(key => {
            delete this.shortcuts[key]
        })
    }

    window = {
        ShortcutsController: this
    }
}