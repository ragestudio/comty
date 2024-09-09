import React from "react"
import classnames from "classnames"
import * as antd from "antd"
import { AnimatePresence, motion } from "framer-motion"

import "./index.less"

function transformTemplate({ x }) {
	return `translateX(${x}px)`
}

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
			transition: 150
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
			...this.options.props,
			close: this.close,
			handleDone: this.handleDone,
			handleFail: this.handleFail,
		}
		return <AnimatePresence>
			{
				this.state.visible && <motion.div
					key={this.props.id}
					id={this.props.id}
					className="drawer"
					style={{
						...this.options.style,
					}}
					transformTemplate={transformTemplate}
					animate={{
						x: [-100, 0],
						opacity: [0, 1],
					}}
					exit={{
						x: [0, -100],
						opacity: [1, 0],
					}}
				>
					{
						React.createElement(this.props.children, componentProps)
					}
				</motion.div>
			}
		</AnimatePresence>
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
		if (app.layout.sidebar) {
			if (prevState.maskVisible !== this.state.maskVisible) {
				app.layout.sidebar.toggleVisibility(this.state.maskVisible)
			}
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
			if (app.layout.modal && lastDrawer.options.confirmOnOutsideClick) {
				return app.layout.modal.confirm({
					descriptionText: lastDrawer.options.confirmOnOutsideClickText ?? "Are you sure you want to close this drawer?",
					onConfirm: () => {
						lastDrawer.close()
					}
				})
			}

			lastDrawer.close()
		}
	}

	toggleMaskVisibility = async (to) => {
		this.setState({
			maskVisible: to ?? !this.state.maskVisible,
		})
	}

	open = (id, component, options) => {
		const refs = this.state.refs ?? {}
		const drawers = this.state.drawers ?? []
		const addresses = this.state.addresses ?? {}

		const instance = {
			id: id,
			ref: React.createRef(),
			children: component,
			options: options,
			controller: this,
		}

		if (typeof addresses[id] === "undefined") {
			drawers.push(<Drawer
				key={id}
				{...instance}
			/>)

			addresses[id] = drawers.length - 1
			refs[id] = instance.ref
		} else {
			drawers[addresses[id]] = <Drawer
				key={id}
				{...instance}
			/>
			refs[id] = instance.ref
		}

		this.setState({
			refs,
			addresses,
			drawers,
		})

		this.toggleMaskVisibility(true)
	}

	close = async (id, { transition = 0 } = {}) => {
		let { addresses, drawers, refs } = this.state

		const index = addresses[id]
		const ref = this.state.refs[id]?.current

		if (typeof ref === "undefined") {
			return console.warn("This drawer not exists")
		}

		if (drawers.length === 1) {
			this.toggleMaskVisibility(false)
		}

		if (transition > 0) {
			await new Promise((resolve) => {
				setTimeout(resolve, transition)
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
			<AnimatePresence>
				{
					this.state.maskVisible && <motion.div
						className="drawers-mask"
						onClick={() => this.closeLastDrawer()}
						initial={{
							opacity: 0,
						}}
						animate={{
							opacity: 1,
						}}
						exit={{
							opacity: 0,
						}}
					/>
				}
			</AnimatePresence>

			<div
				className={classnames(
					"drawers-wrapper",
					{
						["hidden"]: !this.state.drawers.length,
					}
				)}
			>
				<AnimatePresence>
					{this.state.drawers}
				</AnimatePresence>
			</div>
		</>
	}
}