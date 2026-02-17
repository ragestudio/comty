import Core from "vessel/core"
import React from "react"

import ContextMenu from "./components/contextMenu"

function cssPxToInt(str) {
	return parseInt(str.replace("px", ""))
}

function estimateMenuDimensions(items) {
	// filter items that not separators
	const actionsLength = items.filter((i) => i.type !== "separator").length
	const sepatatorsLength = items.length - actionsLength

	// calculate sizes
	const menuWidth = cssPxToInt(app.cores.style.vars["context-menu-width"])

	// sum up height of all items
	let menuHeight =
		cssPxToInt(app.cores.style.vars["context-menu-item-height"]) *
		actionsLength

	// add the separators height (1px)
	menuHeight += sepatatorsLength

	// add the separators margin
	menuHeight +=
		cssPxToInt(app.cores.style.vars["context-menu-separator-margin"]) *
		2 *
		sepatatorsLength

	// add the padding of the menu
	menuHeight += cssPxToInt(app.cores.style.vars["context-menu-padding"]) * 2

	return { menuWidth, menuHeight }
}

function calculateFitCordinates(event, width, height) {
	// obtain cord of mouse
	let x = Math.max(event.clientX, ContextMenuCore.minimunPxToBorder)
	let y = Math.max(event.clientY, ContextMenuCore.minimunPxToBorder)

	// apply displacementAxisXToMouse
	x += ContextMenuCore.displacementAxisXToMouse

	// adjust x coordinate if menu would overflow right edge
	if (x + width + ContextMenuCore.minimunPxToBorder > window.innerWidth) {
		x = window.innerWidth - width - ContextMenuCore.minimunPxToBorder
	}

	// adjust y coordinate if menu would overflow bottom edge
	if (y + height + ContextMenuCore.minimunPxToBorder > window.innerHeight) {
		y = window.innerHeight - height - ContextMenuCore.minimunPxToBorder
	}

	return { x, y }
}

export default class ContextMenuCore extends Core {
	static namespace = "ctx_menu"

	static minimunPxToBorder = 20
	static displacementAxisXToMouse = 20

	contexts = {}

	isMenuOpen = false
	fireWhenClosing = null

	public = {
		close: () => this.close(),
		registerContext: this.registerContext,
		handleEvent: this.handleEvent,
		renderMenu: this.renderMenu,
		estimateMenuDimensions: estimateMenuDimensions,
		calculateFitCordinates: calculateFitCordinates,
	}

	async onInitialize() {
		if (app.isMobile) {
			this.console.warn("Context menu is not available on mobile")
			return false
		}

		let modules = await import.meta.glob(
			["@/context-menu/*/*.js", "@/context-menu/*/*.jsx"],
			{
				eager: true,
			},
		)

		modules = Object.values(modules).map((module) => {
			return module.default
		})

		for (const module of modules) {
			for (const [contextName, context] of Object.entries(module)) {
				this.registerContext(contextName, context)
			}
		}

		document.addEventListener("contextmenu", this.handleEvent)
	}

	registerContext(id, ctx) {
		this.contexts[id] = ctx
	}

	renderMenu(items, x, y) {
		// render menu
		app.cores.window_mng.render(
			"context-menu-portal",
			React.createElement(ContextMenu, {
				items: items,
				ctx: {
					close: this.close,
				},
				fireWhenClosing: (fn) => (this.fireWhenClosing = fn),
			}),
			{
				className: "context-menu-wrapper",
				position: {
					x: x,
					y: y,
				},
				createOrUpdate: true,
				closeOnClickOutside: true,
				onClose: async () => await this.onClose(),
			},
		)

		this.isMenuOpen = true
	}

	handleEvent = async (event) => {
		event.preventDefault()

		// get clicked component
		const component = document.elementFromPoint(
			event.clientX,
			event.clientY,
		)

		if (!component) {
			return null
		}

		// check if right-clicked inside a context menu
		if (component?.closest("#context-menu")) {
			return this.close()
		}

		// check if right-clicked a item with context-menu attribute
		if (component.closest("[context-menu]")) {
			const contextMenuAttr = component
				.closest("[context-menu]")
				.getAttribute("context-menu")

			// check if context-menu attribute is "ignore" or "none"
			if (contextMenuAttr === "ignore" || contextMenuAttr === "none") {
				return null
			}
		}

		// generate items
		const items = await this.generateItems(component)

		// if no items, abort
		if (!items || items.length === 0) {
			this.console.error("No context menu items found, aborting")
			return false
		}

		// calculate best estimated position
		const { menuWidth, menuHeight } = estimateMenuDimensions(items)
		const { x, y } = calculateFitCordinates(event, menuWidth, menuHeight)

		// render menu
		return this.renderMenu(items, x, y)
	}

	generateItems = async (element) => {
		let contextNames = []
		let finalItems = []

		// search parent element with context-menu attribute
		const parentElement = element.closest("[context-menu]")

		// if parent element exists, get context names from attribute
		if (parentElement) {
			const contextAttr = parentElement.getAttribute("context-menu") || ""

			contextNames = contextAttr
				.split(",")
				.map((context) => context.trim())
		}

		// if context includes "no-default", no add default context
		if (!contextNames.includes("no-default")) {
			contextNames.push("default-context")
		} else {
			// remove "no-default" from context names
			contextNames = contextNames.filter(
				(context) => context !== "no-default",
			)
		}

		// process each context sequentially
		for (let i = 0; i < contextNames.length; i++) {
			const contextName = contextNames[i]

			// obtain contexted items
			const contextItems = await this.getContextItems(
				contextName,
				parentElement,
				element,
			)

			// if any contexted items exist, add them to the final items
			if (contextItems && contextItems.length > 0) {
				finalItems = finalItems.concat(contextItems)

				// if is not the last context, add a separator
				if (i < contextNames.length - 1) {
					finalItems.push({
						type: "separator",
					})
				}
			}
		}

		// assign indices
		finalItems = finalItems.map((item, index) => {
			if (!item.index) {
				item.index = index
			}
			return item
		})

		// sort items by index
		finalItems.sort((a, b) => a.index - b.index)

		// remove undefined items
		finalItems = finalItems.filter((item) => item !== undefined)

		return finalItems
	}

	getContextItems = async (contextName, parentElement, element) => {
		const contextObject = this.contexts[contextName]

		if (!contextObject) {
			this.console.warn(`Context ${contextName} not found`)
			return []
		}

		// if is a function, execute it to get the elements
		if (typeof contextObject === "function") {
			try {
				const newItems = []

				// call the function
				const result = await contextObject(
					newItems,
					parentElement,
					element,
					{ close: this.close },
				)

				return result || newItems
			} catch (error) {
				this.console.error(
					`Error processing context [${contextName}] >`,
					error,
				)
				return []
			}
		}

		// if it is an object (array), return it directly
		return Array.isArray(contextObject) ? contextObject : []
	}

	// triggered when the menu is closing
	onClose = async (delay = 200) => {
		if (typeof this.fireWhenClosing === "function") {
			await this.fireWhenClosing()
		}

		if (delay > 0) {
			await new Promise((resolve) => setTimeout(resolve, delay))
		}

		this.isMenuOpen = false
	}

	// close the menu
	close = () => {
		if (!this.isMenuOpen) {
			return null
		}

		return app.cores.window_mng.close("context-menu-portal")
	}
}
