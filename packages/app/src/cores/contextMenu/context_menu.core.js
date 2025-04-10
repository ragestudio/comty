import React from "react"
import { Core, EventBus } from "@ragestudio/vessel"
import ContextMenu from "./components/contextMenu"
import DefaultContext from "@config/context-menu/default"
import PostCardContext from "@config/context-menu/post"

export default class ContextMenuCore extends Core {
	static namespace = "contextMenu"

	contexts = {
		...DefaultContext,
		...PostCardContext,
	}

	eventBus = new EventBus()
	isMenuOpen = false
	fireWhenClosing = null

	async onInitialize() {
		if (app.isMobile) {
			this.console.warn("Context menu is not available on mobile")
			return false
		}

		document.addEventListener("contextmenu", this.handleEvent)
	}

	handleEvent = async (event) => {
		event.preventDefault()

		// obtain cord of mouse
		const x = event.clientX
		const y = event.clientY

		// get clicked component
		const component = document.elementFromPoint(x, y)

		// check if right-clicked inside a context menu
		if (
			component.classList.contains("contextMenu") ||
			component.closest(".contextMenu")
		) {
			return
		}

		// gen items
		const items = await this.generateItems(component)

		// if no items, abort
		if (!items || items.length === 0) {
			this.console.error("No context menu items found, aborting")
			return false
		}

		// render menu
		this.show({
			cords: { x, y },
			clickedComponent: component,
			items: items,
			fireWhenClosing: (fn) => {
				this.fireWhenClosing = fn
			},
			ctx: {
				close: this.close,
			},
		})
	}

	registerContext = (element, context) => {
		this.contexts[element] = context
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

			// if context includes "ignore", no show context menu
			if (contextNames.includes("ignore")) {
				return null
			}
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

	show = async (props) => {
		app.cores.window_mng.render(
			"context-menu-portal",
			React.createElement(ContextMenu, props),
			{
				useFrame: false,
				createOrUpdate: true,
				closeOnClickOutside: true, // sets default click outside behavior
				onClose: this.onClose, // triggered when the menu is closing
			},
		)

		this.isMenuOpen = true
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
	close = async () => {
		app.cores.window_mng.close("context-menu-portal")
	}
}
