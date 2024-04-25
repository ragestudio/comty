import React from "react"
import Core from "evite/src/core"

import { DOMWindow } from "@components/RenderWindow"
import ContextMenu from "./components/contextMenu"

import InternalContexts from "@config/context-menu"

export default class ContextMenuCore extends Core {
    static namespace = "contextMenu"

    public = {
        show: this.show.bind(this),
        hide: this.hide.bind(this),
        registerContext: this.registerContext.bind(this),
    }

    contexts = Object()

    DOMWindow = new DOMWindow({
        id: "contextMenu",
        className: "contextMenuWrapper",
        clickOutsideToClose: true,
    })

    async onInitialize() {
        if (app.isMobile) {
            this.console.warn("Context menu is not available on mobile")
            return false
        }

        document.addEventListener("contextmenu", this.handleEvent.bind(this))
    }

    registerContext(element, context) {
        this.contexts[element] = context
    }

    async generateItems(element) {
        let items = []

        // find the closest context with attribute (context-menu)
        // if not found, use default context
        const parentElement = element.closest("[context-menu]")

        let contexts = []

        if (parentElement) {
            contexts = parentElement.getAttribute("context-menu") ?? []

            if (typeof contexts === "string") {
                contexts = contexts.split(",").map((context) => context.trim())
            }
        }

        // if context includes ignore, return null
        if (contexts.includes("ignore")) {
            return null
        }

        // check if context includes no-default, if not, push default context and remove no-default
        if (contexts.includes("no-default")) {
            contexts = contexts.filter((context) => context !== "no-default")
        } else {
            contexts.push("default-context")
        }

        for await (const context of contexts) {
            let contextObject = this.contexts[context] || InternalContexts[context]

            if (typeof contextObject === "function") {
                contextObject = await contextObject(parentElement, element, {
                    close: this.hide,
                })
            }

            // push divider
            if (items.length > 0) {
                items.push({
                    type: "separator"
                })
            }

            if (Array.isArray(contextObject)) {
                items.push(...contextObject)
            } else {
                items.push(contextObject)
            }
        }

        // fullfill each item with a correspondent index if missing declared
        items = items.map((item, index) => {
            if (!item.index) {
                item.index = index
            }

            return item
        })

        // short items (if has declared index)
        items = items.sort((a, b) => a.index - b.index)

        // remove undefined items
        items = items.filter((item) => item !== undefined)

        return items
    }

    async handleEvent(event) {
        event.preventDefault()

        // get the cords of the mouse
        const x = event.clientX
        const y = event.clientY

        // get the component that was clicked
        const component = document.elementFromPoint(x, y)

        // check if is clicking inside a context menu or a children inside a context menu
        if (component.classList.contains("contextMenu") || component.closest(".contextMenu")) {
            return
        }

        const items = await this.generateItems(component)

        if (!items) {
            this.console.warn("No context menu items found, aborting")
            return false
        }

        this.show({
            cords: {
                x,
                y,
            },
            clickedComponent: component,
            items: items,
            ctx: {
                close: this.hide.bind(this),
            }
        })
    }

    show(payload) {
        this.DOMWindow.render(React.createElement(ContextMenu, payload))
    }

    hide() {
        this.DOMWindow.remove()
    }
}