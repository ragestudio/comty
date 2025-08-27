import Core from "vessel/core"

import React from "react"
import { createRoot } from "react-dom/client"

import DefaultWindow from "./components/defaultWindow"

import VirtualWindow from "./VirtualWindow"
import DomWindow from "./DomWindow"

import "./index.less"

class WindowsRender extends React.Component {
	render() {
		return this.props.renders
	}
}

export default class WindowManager extends Core {
	static namespace = "window_mng"
	static idMount = "windows"

	rootElement = null
	root = null
	windows = []

	public = {
		close: this.closeById.bind(this),
		render: this.render.bind(this),
		open: this.open.bind(this),
	}

	async onInitialize() {
		this.rootElement = document.createElement("div")
		this.rootElement.setAttribute("id", this.constructor.idMount)

		document.body.append(this.rootElement)

		this.root = createRoot(this.rootElement)
		this.renderWindows()

		document.addEventListener("click", this.handleGlobalClick)
	}

	/**
	 * Creates a new element with the specified id and appends it to the root element.
	 * If the element already exists and createOrUpdate option is false, it will throw an error.
	 * If the element already exists and createOrUpdate option is true, it will update the element.
	 * If useFrame option is true, it wraps the fragment with a DefaultWindow component before rendering.
	 *
	 * @param {string} id - The id of the element to create or update.
	 * @param {ReactElement} component - The React element to render inside the created element.
	 * @param {Object} options - The options for creating or updating the element.
	 * @param {boolean} options.createOrUpdate - Specifies whether to create a new element or update an existing one.
	 * @param {boolean} options.closeOnClickOutside - Specifies whether to close the window when the user clicks outside of it.
	 * @param {function} options.onClose - Specifies a callback function to be called when the window is closed.
	 * @return {HTMLElement} The created or updated element.
	 */
	async render(
		id,
		component,
		{
			position = null,
			className = null,
			props = null,
			onClose = null,
			closeOnClickOutside = false,
			createOrUpdate = false,
		} = {},
	) {
		let win = this.windows.find((node) => {
			return node.id === id
		})

		if (win) {
			this.console.log("Existent window", win)

			if (createOrUpdate === true) {
				win.updatePosition(position?.x, position?.y)
				win.render(component)

				return win
			}

			id = `${id}_${Date.now()}`
		}

		win = new DomWindow(this, id, {
			className: className,
			position: position,
			onCloseCallback: onClose,
			closeOnClickOutside: closeOnClickOutside,
		})

		win.render(component, props)

		this.windows.push(win)

		return win
	}

	async open(id, element) {
		const existentWindow = this.windows.find((node) => {
			return node.id === id
		})

		if (existentWindow) {
			id = `${id}_${Date.now()}`
		}

		console.debug("Opening new window", {
			id,
			element,
		})

		const win = new VirtualWindow(this, id, {
			element: React.createElement(DefaultWindow, {
				key: id,
				children: element,
			}),
		})

		this.windows.push(win)

		this.renderWindows()

		return win
	}

	/**
	 * Closes the window with the given ID.
	 *
	 * @param {string} id - The ID of the window to be closed.
	 * @return {boolean} Returns true if the window was successfully closed, false otherwise.
	 */
	async closeById(id) {
		const win = this.windows.find((_win) => {
			return _win.id === id
		})

		if (!win) {
			throw new Error("Window not found")
		}

		return await this.close(win)
	}

	async close(win) {
		if (!(win instanceof DomWindow) && !(win instanceof VirtualWindow)) {
			throw new Error("Window must be an instance of DomWindow")
		}

		const winIndex = this.windows.indexOf(win)

		if (winIndex === -1) {
			throw new Error("Window not found in the list")
		}

		this.windows.splice(winIndex, 1)

		await win.close()

		if (typeof win.unmount === "function") {
			win.unmount()
		}

		return win
	}

	renderWindows = () => {
		this.root.render(
			<WindowsRender
				renders={this.windows.map((_win) => {
					return _win.params.element
				})}
			/>,
		)
	}

	handleGlobalClick = (event) => {
		// get all windows with closeOnClickOutside option
		const windows = this.windows.filter((_win) => {
			return _win.params.closeOnClickOutside === true
		})

		if (windows.length === 0) {
			return null
		}

		// get the new one
		const win = windows[windows.length - 1]
		const winIndex = windows.indexOf(win)

		// abort if not in index or is a click inside the window
		if (winIndex === -1 || !win || win.element.contains(event.target)) {
			return null
		}

		this.close(win)
	}
}
