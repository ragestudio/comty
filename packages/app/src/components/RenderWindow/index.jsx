import React from "react"
import ReactDOM from "react-dom"
import { Rnd } from "react-rnd"
import { Icons } from "components/Icons"

import "./index.less"

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

class DefaultWindowRender extends React.Component {
	state = {
		actions: [],
		dimensions: {
			height: this.props.height ?? 600,
			width: this.props.width ?? 400,
		},
		position: this.props.defaultPosition,
		visible: false,
	}

	componentDidMount = () => {
		this.setDefaultActions()

		if (typeof this.props.actions !== "undefined") {
			if (Array.isArray(this.props.actions)) {
				const actions = this.state.actions ?? []

				this.props.actions.forEach((action) => {
					actions.push(action)
				})

				this.setState({ actions })
			}
		}

		if (!this.state.position) {
			this.setState({ position: this.getCenterPosition() })
		}

		this.toogleVisibility(true)
	}

	toogleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	getCenterPosition = () => {
		const dimensions = this.state?.dimensions ?? {}

		const windowHeight = dimensions.height ?? 600
		const windowWidth = dimensions.width ?? 400

		return {
			x: window.innerWidth / 2 - windowWidth / 2,
			y: window.innerHeight / 2 - windowHeight / 2,
		}
	}

	setDefaultActions = () => {
		const { actions } = this.state

		actions.push({
			key: "close",
			render: () => <Icons.XCircle style={{ margin: 0, padding: 0 }} />,
			onClick: () => {
				this.props.destroy()
			},
		})

		this.setState({ actions })
	}

	renderActions = () => {
		const actions = this.state.actions

		if (Array.isArray(actions)) {
			return actions.map((action) => {
				return (
					<div key={action.key} onClick={action.onClick} {...action.props}>
						{React.isValidElement(action.render) ? action.render : React.createElement(action.render)}
					</div>
				)
			})
		}

		return null
	}

	getComponentRender = () => {
		return React.isValidElement(this.props.children)
			? React.cloneElement(this.props.children, this.props.renderProps)
			: React.createElement(this.props.children, this.props.renderProps)
	}

	render() {
		const { position, dimensions, visible } = this.state

		if (!visible) {
			return null
		}

		return (
			<Rnd
				default={{
					...position,
					...dimensions,
				}}
				onResize={(e, direction, ref, delta, position) => {
					this.setState({
						dimensions: {
							width: ref.offsetWidth,
							height: ref.offsetHeight,
						},
						position,
					})
				}}
				dragHandleClassName="window_topbar"
				minWidth={this.props.minWidth ?? "300px"}
				minHeight={this.props.minHeight ?? "200px"}
			>
				<div
					style={{
						height: dimensions.height,
						width: dimensions.width,
					}}
					className="window_wrapper"
				>
					<div className="window_topbar">
						<div className="title">{this.props.id}</div>
						<div className="actions">{this.renderActions()}</div>
					</div>

					<div className="window_body">{this.getComponentRender()}</div>
				</div>
			</Rnd>
		)
	}
}

export { DOMWindow, DefaultWindowRender }