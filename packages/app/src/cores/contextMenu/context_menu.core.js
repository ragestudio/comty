import React from "react"
import Core from "evite/src/core"
import EventEmitter from "evite/src/internals/EventEmitter"

import ContextMenu from "./components/contextMenu"

import DefaultContenxt from "@config/context-menu/default"
import PostCardContext from "@config/context-menu/post"

export default class ContextMenuCore extends Core {
    static namespace = "contextMenu"

    contexts = {
        ...DefaultContenxt,
        ...PostCardContext,
    }

    eventBus = new EventEmitter()

    async onInitialize() {
        if (app.isMobile) {
            this.console.warn("Context menu is not available on mobile")
            return false
        }

        document.addEventListener("contextmenu", this.handleEvent.bind(this))
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
            registerOnClose: (cb) => { this.eventBus.on("close", cb) },
            unregisterOnClose: (cb) => { this.eventBus.off("close", cb) },
            cords: {
                x,
                y,
            },
            clickedComponent: component,
            items: items,
            ctx: {
                close: this.onClose,
            }
        })
    }

    registerContext = async (element, context) => {
        this.contexts[element] = context
    }

    generateItems = async (element) => {
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

        for await (const [index, context] of contexts.entries()) {
            let contextObject = this.contexts[context]

            if (!contextObject) {
                this.console.warn(`Context ${context} not found`)
                continue
            }

            if (typeof contextObject === "function") {
                contextObject = await contextObject(items, parentElement, element, {
                    close: this.onClose,
                })
            }

            // push divider
            if (contexts.length > 0 && index !== contexts.length - 1) {
                items.push({
                    type: "separator"
                })
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

    show = async (payload) => {
        app.cores.window_mng.render(
            "context-menu-portal",
            React.createElement(ContextMenu, payload),
            {
                onClose: this.onClose,
                createOrUpdate: true,
                closeOnClickOutside: true,
            },
        )
    }

    onClose = async (delay = 200) => {
        this.eventBus.emit("close", delay)

        await new Promise((resolve) => {
            setTimeout(resolve, delay)
        })
    }
}