import React from "react"
import { Core } from "vessel"

import { createRoot } from "react-dom/client"

import DefaultWindow from "./components/defaultWindow"

import "./index.less"

export default class WindowManager extends Core {
    static namespace = "window_mng"

    static idMount = "windows"

    root = null
    windows = []

    public = {
        close: this.close.bind(this),
        render: this.render.bind(this),
    }

    async onInitialize() {
        this.root = document.createElement("div")

        this.root.setAttribute("id", this.constructor.idMount)

        document.body.append(this.root)
    }

    handleWrapperClick = (id, event) => {
        const element = this.root.querySelector(`#${id}`)

        if (element) {
            if (!element.contains(event.target)) {
                this.close(id)
            }
        }
    }

    /**
     * Creates a new element with the specified id and appends it to the root element.
     * If the element already exists and createOrUpdate option is false, it will throw an error.
     * If the element already exists and createOrUpdate option is true, it will update the element.
     * If useFrame option is true, it wraps the fragment with a DefaultWindow component before rendering.
     *
     * @param {string} id - The id of the element to create or update.
     * @param {ReactElement} fragment - The React element to render inside the created element.
     * @param {Object} options - The options for creating or updating the element.
     * @param {boolean} options.useFrame - Specifies whether to wrap the fragment with a DefaultWindow component.
     * @param {boolean} options.createOrUpdate - Specifies whether to create a new element or update an existing one.
     * @return {HTMLElement} The created or updated element.
     */
    async render(
        id,
        fragment,
        {
            useFrame = false,
            onClose = null,
            createOrUpdate = false,
            closeOnClickOutside = false,
        } = {}
    ) {
        let element = document.createElement("div")
        let node = null
        let win = null

        // check if window already exist
        // if exist, try to automatically generate a new id
        if (this.root.querySelector(`#${id}`) && !createOrUpdate) {
            const newId = `${id}_${Date.now()}`

            this.console.warn(`Window ${id} already exist, overwritting id to ${newId}.\nYou can use {createOrUpdate = true} option to force refresh render of window`)

            id = newId
        }

        // check if window already exist, if exist and createOrUpdate is true, update the element
        // if not exist, create a new element
        if (this.root.querySelector(`#${id}`) && createOrUpdate) {
            element = document.getElementById(id)

            win = this.windows.find((_node) => {
                return _node.id === id
            })

            if (win) {
                node = win.node
            }
        } else {
            element.setAttribute("id", id)

            this.root.appendChild(element)

            node = createRoot(element)

            win = {
                id: id,
                node: node,
                onClose: onClose,
                closeOnClickOutside: closeOnClickOutside,
            }

            this.windows.push(win)

            // if closeOnClickOutside is true, add click event listener
            if (closeOnClickOutside === true) {
                document.addEventListener(
                    "click",
                    (e) => this.handleWrapperClick(id, e),
                    { once: true },
                )
            }
        }

        // if useFrame is true, wrap the fragment with a DefaultWindow component
        if (useFrame) {
            fragment = <DefaultWindow>
                {fragment}
            </DefaultWindow>
        }

        node.render(React.cloneElement(fragment, {
            close: () => {
                this.close(id, onClose)
            }
        }))

        return {
            element,
            ...win,
        }
    }

    /**
     * Closes the window with the given ID.
     *
     * @param {string} id - The ID of the window to be closed.
     * @return {boolean} Returns true if the window was successfully closed, false otherwise.
     */
    async close(id) {
        const element = document.getElementById(id)

        const win = this.windows.find((node) => {
            return node.id === id
        })

        if (!win || !element) {
            this.console.error(`Window [${id}] not found`)
            return false
        }

        this.console.debug(`Closing window ${id}`, win, element)

        // if onClose callback is defined, call it
        if (typeof win.onClose === "function") {
            this.console.debug(`Trigging close callback for window ${id}`)
            await win.onClose()
        }

        // remove the element from the DOM
        this.console.debug(`Removing element from DOM for window ${id}`)
        win.node.unmount()
        this.root.removeChild(element)

        // remove the window from the list
        this.console.debug(`Removing window from list for window ${id}`)
        this.windows = this.windows.filter((node) => {
            return node.id !== id
        })

        this.console.debug(`Window ${id} closed`)
        return true
    }
}