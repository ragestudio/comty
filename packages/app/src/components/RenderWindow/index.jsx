import React from "react"
import ReactDOM from "react-dom"

class DOMWindow {
	constructor(props = {}) {
		this.props = props

		this.id = this.props.id
		this.key = 0

		this.currentRender = null
		this.root = document.getElementById("app_windows")
		this.element = document.createElement("div")

		this.element.setAttribute("id", this.id)
		this.element.setAttribute("key", this.key)
		this.element.setAttribute("classname", this.props.className)

		// if props clickOutsideToClose is true, add event listener to close window
		if (this.props.clickOutsideToClose) {
			document.addEventListener("click", this.handleWrapperClick)
		}

		// handle root container
		if (!this.root) {
			this.root = document.createElement("div")
			this.root.setAttribute("id", "app_windows")

			document.body.append(this.root)
		}

		// get all windows opened has container
		const rootNodes = this.root.childNodes

		// ensure this window has last key from rootNode
		if (rootNodes.length > 0) {
			const lastChild = rootNodes[rootNodes.length - 1]
			const lastChildKey = Number(lastChild.getAttribute("key"))

			this.key = lastChildKey + 1
		}
	}

	handleWrapperClick = (event) => {
		if (!this.currentRender) {
			return
		}

		// if click in not renderer fragment, close window
		if (!this.element.contains(event.target)) {
			this.remove()
		}
	}

	render = (fragment) => {
		this.root.appendChild(this.element)

		this.currentRender = fragment

		return ReactDOM.render(fragment, this.element)
	}

	remove = () => {
		this.root.removeChild(this.element)
		this.currentRender = null
	}

	destroy = () => {
		this.element.remove()
		this.currentRender = null
	}

	createDefaultWindow = (children, props) => {
		return this.render(<DefaultWindowRender {...this.props} {...props} id={this.id} key={this.key} destroy={this.destroy} >
			{children}
		</DefaultWindowRender>)
	}
}

export { DOMWindow }