import React from "react"
import Core from "evite/src/core"

import { DOMWindow } from "components/RenderWindow"
import ContextMenu from "./components/contextMenu"

import InternalContexts from "schemas/menu-contexts"
import { copyToClipboard } from "utils"

export default class ContextMenuCore extends Core {
    static namespace = "ContextMenu"
    static public = ["show", "hide", "registerContext"]

    contexts = Object()

    defaultContext = [
        {
            label: "Copy",
            icon: "Copy",
            action: (clickedItem, ctx) => {
                // get selected text
                const selectedText = window.getSelection().toString()

                copyToClipboard(selectedText)
                
                ctx.close()
            }
        },
        {
            label: "Report a bug",
            icon: "AlertTriangle",
            action: (clickedItem, ctx) => {
                app.eventBus.emit("app.reportBug", {
                    clickedItem,
                })

                ctx.close()
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

    generateItems = async (element) => {
        let items = []

        // find the closest context with attribute (context-menu)
        // if not found, use default context
        const parentElement = element.closest("[context-menu]")

        if (parentElement) {
            let contexts = parentElement.getAttribute("context-menu")

            if (!contexts) {
                return
            }

            contexts = contexts.split(",").map((context) => context.trim())

            // generate items
            contexts.forEach(async (context) => {
                let contextObject = this.contexts[context] || InternalContexts[context]

                if (typeof contextObject === "function") {
                    contextObject = await contextObject(element, parentElement, {
                        close: this.hide()
                    })
                }

                if (contextObject) {
                    items.push(...contextObject)
                }
            })
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

        // push default items
        if (items.length > 0) {
            items.push({
                type: "separator"
            })
        }

        items.push(...this.defaultContext)

        return items
    }

    handleEvent = async (event) => {
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
            console.warn("No context menu items found, aborting")
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
                close: this.hide
            }
        })
    }

    show = (payload) => {
        this.DOMWindow.render(React.createElement(ContextMenu, payload))
    }

    hide = () => {
        this.DOMWindow.remove()
    }
}