import React from "react"
import { createRoot } from "react-dom/client"

export default class DomWindow {
	constructor(controller, id, params) {
		if (!controller) {
			throw new Error("Window controller is required")
		}

		if (!id) {
			throw new Error("Window ID is required")
		}

		if (!params) {
			throw new Error("Window params are required")
		}

		this.controller = controller
		this.id = id
		this.params = params

		this.position = {
			x: params.position?.x ?? 0,
			y: params.position?.y ?? 0,
		}

		this.element = document.createElement("div")
		this.element.setAttribute("id", this.id)

		// set position
		this.element.classList.add("dom-window")
		this.element.style.left = `${this.position.x}px`
		this.element.style.top = `${this.position.y}px`

		if (typeof this.params.className === "string") {
			this.element.classList.add(this.params.className)
		}

		document.body.appendChild(this.element)
	}

	node = null

	updatePosition = (x, y) => {
		this.position.x = x ?? this.position.x
		this.position.y = y ?? this.position.y

		this.element.style.left = `${this.position.x}px`
		this.element.style.top = `${this.position.y}px`
	}

	close = async () => {
		console.log(`[${this.id}] Closing window`, this)

		// if onClose callback is defined, call it
		if (typeof this.params.onCloseCallback === "function") {
			console.debug(`[${this.id}] Trigging on closing callback`)

			await this.params.onCloseCallback(this)
		}

		return this
	}

	render = (component, props) => {
		if (!this.node) {
			this.node = createRoot(this.element)
		}

		return this.node.render(
			React.cloneElement(component, {
				...props,
				close: () => {
					app.cores.window_mng.close(this.id)
				},
			}),
		)
	}

	unmount = () => {
		// remove the element from the DOM
		this.node.unmount()

		document.body.removeChild(this.element)
	}
}
