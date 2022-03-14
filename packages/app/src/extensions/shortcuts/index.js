export class ShortcutsController {
    constructor() {
        this.shortcuts = {}

        document.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase()

            const shortcut = this.shortcuts[key]

            if (shortcut) {
                event.preventDefault()

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

                if (typeof shortcut.fn === "function") {
                    shortcut.fn()
                }
            }
        })
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
}

export const extension = {
    key: "shortcuts",
    expose: [
        {
            initialization: [
                (app, main) => {
                    app.ShortcutsController = new ShortcutsController()

                    main.setToWindowContext("ShortcutsController", app.ShortcutsController)
                }
            ],
        },
    ]
}

export default extension