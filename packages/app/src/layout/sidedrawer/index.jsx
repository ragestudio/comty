import React from "react"
import classnames from "classnames"

import "./index.less"

export default class Sidedrawer extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			render: null
		}

		this.SidedrawerController = {
			render: this._render,
			close: this._close
		}

		window.app["SidedrawerController"] = this.SidedrawerController
	}

	containerRef = React.createRef()

	componentWillUnmount = () => {
		this.unlistenEscape()
	}

	_render = (component) => {
		this.listenEscape()
		this.setState({ render: component })
	}

	close = () => {
		this.unlistenEscape()
		this.setState({ render: null })
	}

	listenEscape = () => {
		document.addEventListener("keydown", this.handleKeyPress)
	}

	unlistenEscape = () => {
		document.removeEventListener("keydown", this.handleKeyPress)
	}

	handleKeyPress = (event) => {
		// avoid handle keypress when is nothing to render
		if (!this.state.render) {
			return false
		}

		let isEscape = false

		if ("key" in event) {
			isEscape = event.key === "Escape" || event.key === "Esc"
		} else {
			isEscape = event.keyCode === 27
		}

		if (isEscape) {
			this.close()
		}
	}

	renderComponent = (component) => {
		if (!component) {
			return null
		}

		if (React.isValidElement(component)) {
			return React.cloneElement(component)
		}

		return React.createElement(component)
	}

	render() {
		return (
			<div ref={this.containerRef} className={classnames("sidedrawer", { hided: !this.state.render })}>
				<React.Fragment>{this.renderComponent(this.state.render)}</React.Fragment>
			</div>
		)
	}
}
