import React from "react"
import Core from "evite/src/core"

import { DOMWindow } from "components/RenderWindow"
import ContextMenu from "./components/contextMenu"

import Contexts from "schemas/menu-contexts"

export default class ContextMenuCore extends Core {
    static namespace = "ContextMenu"
    static public = ["show", "hide", "registerContext"]

    contexts = Object()
    defaultContext = [
        {
            label: "Report a bug",
            icon: "AlertTriangle",
            action: (parent, element) => {
                app.eventBus.emit("app.reportBug", {
                    parent,
                    element
                })
            }
        }
    ]

    DOMWindow = new DOMWindow({
        id: "contextMenu",
        className: "contextMenuWrapper",
        clickOutsideToClose: true,
    })

    async initialize() {
        document.addEventListener("contextmenu", this.handleEvent)
    }

    registerContext = (element, context) => {
        this.contexts[element] = context
    }

    generateItems = (element) => {
        let items = []

        // find the closest context with attribute (context-menu)
        // if not found, use default context
        const parentElement = element.closest("[context-menu]")

        if (parentElement) {
            const context = parentElement.getAttribute("context-menu")

            // if context is not registered, try to fetch it from the constants contexts object
            if (!this.contexts[context]) {
                items = Contexts[context] || []
            } else {
                items = this.contexts[context] ?? []
            }

            if (typeof items === "function") {
                items = items(
                    parentElement,
                    element,
                    {
                        close: this.hide
                    }
                )
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

        if (items.length > 0) {
            items.push({
                type: "separator"
            })
        }

        items.push(...this.defaultContext)

        return items
    }

    handleEvent = (event) => {
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

        this.show({
            cords: {
                x,
                y,
            },
            clickedComponent: component,
            items: this.generateItems(component),
        })
    }

    show = (payload) => {
        this.DOMWindow.render(React.createElement(ContextMenu, payload))
    }

    hide = () => {
        this.DOMWindow.remove()
    }
}