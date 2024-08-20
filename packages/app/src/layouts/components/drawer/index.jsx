import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import "./index.less"

export class Drawer extends React.Component {
	options = this.props.options ?? {}

	state = {
		visible: false,
	}

	toggleVisibility = (to) => {
		to = to ?? !this.state.visible

		this.setState({ visible: to })
	}

	close = async () => {
		if (typeof this.options.onClose === "function") {
			this.options.onClose()
		}

		this.toggleVisibility(false)

		this.props.controller.close(this.props.id, {
			delay: 500
		})
	}

	handleDone = (...context) => {
		if (typeof this.options.onDone === "function") {
			this.options.onDone(this, ...context)
		}
	}

	handleFail = (...context) => {
		if (typeof this.options.onFail === "function") {
			this.options.onFail(this, ...context)
		}
	}

	componentDidMount = async () => {
		if (typeof this.props.controller === "undefined") {
			throw new Error(`Cannot mount an drawer without an controller`)
		}

		if (typeof this.props.children === "undefined") {
			throw new Error(`Empty component`)
		}

		this.toggleVisibility(true)
	}

	render() {
		const componentProps = {
			...this.options.componentProps,
			close: this.close,
			handleDone: this.handleDone,
			handleFail: this.handleFail,
		}

		return <Motion
			key={this.props.id}
			style={{
				x: spring(!this.state.visible ? 100 : 0),
				opacity: spring(!this.state.visible ? 0 : 1),
			}}
		>
			{({ x, opacity }) => {
				return <div
					key={this.props.id}
					id={this.props.id}
					className="drawer"
					style={{
						...this.options.style,
						transform: `translateX(-${x}%)`,
						opacity: opacity,
					}}
				>

					{
						React.createElement(this.props.children, componentProps)
					}
				</div>
			}}
		</Motion>
	}
}

export default class DrawerController extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			addresses: {},
			refs: {},
			drawers: [],

			maskVisible: false,
			maskRender: false,
		}

		this.interface = {
			open: this.open,
			close: this.close,
			closeAll: this.closeAll,
			drawersLength: () => this.state.drawers.length,
			isMaskVisible: () => this.state.maskVisible,
		}
	}

	componentDidMount = () => {
		app.layout["drawer"] = this.interface

		this.listenEscape()
	}

	componentWillUnmount = () => {
		delete app.layout["drawer"]

		this.unlistenEscape()
	}

	componentWillUpdate = (prevProps, prevState) => {
		// is mask visible, hide sidebar with `app.layout.sidebar.toggleVisibility(false)`
		if (prevState.maskVisible !== this.state.maskVisible) {
			app.layout.sidebar.toggleVisibility(false)
		} else if (prevState.maskRender !== this.state.maskRender) {
			app.layout.sidebar.toggleVisibility(true)
		}
	}

	listenEscape = () => {
		document.addEventListener("keydown", this.handleEscKeyPress)
	}

	unlistenEscape = () => {
		document.removeEventListener("keydown", this.handleEscKeyPress)
	}

	handleEscKeyPress = (event) => {
		if (this.state.drawers.length === 0) {
			return false
		}

		let isEscape = false

		if ("key" in event) {
			isEscape = event.key === "Escape" || event.key === "Esc"
		} else {
			isEscape = event.keyCode === 27
		}

		if (isEscape) {
			this.closeLastDrawer()
		}
	}

	getLastDrawer = () => {
		return this.state.drawers[this.state.drawers.length - 1].ref.current
	}

	closeLastDrawer = () => {
		const lastDrawer = this.getLastDrawer()

		if (lastDrawer) {
			lastDrawer.close()
		}
	}

	toggleMaskVisibility = async (to) => {
		to = to ?? !this.state.maskVisible

		this.setState({
			maskVisible: to,
		})

		if (to === true) {
			this.setState({
				maskRender: true
			})
		} else {
			await new Promise((resolve) => {
				setTimeout(resolve, 500)
			})

			this.setState({
				maskRender: false
			})
		}
	}

	open = (id, component, options) => {
		const refs = this.state.refs ?? {}
		const drawers = this.state.drawers ?? []
		const addresses = this.state.addresses ?? {}

		const instance = {
			id,
			key: id,
			ref: React.createRef(),
			children: component,
			options,
			controller: this,
		}

		if (typeof addresses[id] === "undefined") {
			drawers.push(<Drawer {...instance} />)

			addresses[id] = drawers.length - 1
			refs[id] = instance.ref
		} else {
			drawers[addresses[id]] = <Drawer {...instance} />
			refs[id] = instance.ref
		}

		this.setState({
			refs,
			addresses,
			drawers,
		})

		this.toggleMaskVisibility(true)
	}

	close = async (id, { delay = 0 }) => {
		let { addresses, drawers, refs } = this.state

		const index = addresses[id]
		const ref = this.state.refs[id]?.current

		if (typeof ref === "undefined") {
			return console.warn("This drawer not exists")
		}

		if (drawers.length === 1) {
			this.toggleMaskVisibility(false)
		}

		if (delay > 0) {
			await new Promise((resolve) => {
				setTimeout(resolve, delay)
			})
		}

		if (typeof drawers[index] !== "undefined") {
			drawers = drawers.filter((value, i) => i !== index)
		}

		delete addresses[id]
		delete refs[id]

		this.setState({
			refs,
			addresses,
			drawers,
		})
	}

	closeAll = () => {
		this.state.drawers.forEach((drawer) => {
			drawer.ref.current.close()
		})
	}

	render() {
		return <>
			<Motion
				style={{
					opacity: spring(this.state.maskVisible ? 1 : 0),
				}}
			>
				{({ opacity }) => {
					return <div
						className="drawers-mask"
						onClick={() => this.closeLastDrawer()}
						style={{
							opacity,
							display: this.state.maskRender ? "block" : "none",
						}}
					/>
				}}
			</Motion>

			<div
				className={classnames(
					"drawers-wrapper",
					{
						["hidden"]: !this.state.drawers.length,
					}
				)}
			>
				{this.state.drawers}
			</div>
		</>
	}
}