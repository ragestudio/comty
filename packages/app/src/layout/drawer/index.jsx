import React from "react"
import * as antd from "antd"
import EventEmitter from "@foxify/events"

export class Drawer extends React.Component {
	options = this.props.options ?? {}
	events = new EventEmitter()
	state = {
		locked: this.options.locked ?? false,
		visible: false,
	}

	unlock = () => this.setState({ locked: false })
	lock = () => this.setState({ locked: true })

	componentDidMount = async () => {
		if (typeof this.props.controller === "undefined") {
			throw new Error(`Cannot mount an drawer without an controller`)
		}
		if (typeof this.props.children === "undefined") {
			throw new Error(`Empty component`)
		}

		if (this.props.children) {
			this.setState({ visible: true })
		}
	}

	onClose = () => {
		if (typeof this.options.props?.closable !== "undefined" && !this.options.props?.closable) {
			return false
		}
		this.close()
	}

	close = (context) => {
		if (typeof this.options.onClose === "function") {
			this.options.onClose(...context)
		}

		this.setState({ visible: false })
		this.unlock()

		setTimeout(() => {
			this.props.controller.destroy(this.props.id)
		}, 400)
	}

	sendEvent = (...context) => {
		return this.props.controller.sendEvent(this.props.id, ...context)
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

	render() {
		const drawerProps = {
			destroyOnClose: true,
			bodyStyle: { padding: 0 },
			...this.options.props,
			ref: this.props.ref,
			closable: false,
			key: this.props.id,
			onClose: this.onClose,
			visible: this.state.visible,
		}
		const componentProps = {
			...this.options.componentProps,
			events: this.events,
			close: this.close,
			handleDone: this.handleDone,
			handleFail: this.handleFail,
		}

		return (
			<antd.Drawer {...drawerProps}>
				<antd.PageHeader
					onBack={this.onClose}
					title={this.props.title ?? "Close"}
					backIcon={this.props.backIcon}
					subTitle={this.props.subtitle}
				/>
				<div style={{ padding: "10px 30px" }}>{React.createElement(this.props.children, componentProps)}</div>
			</antd.Drawer>
		)
	}
}

export default class DrawerController extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			addresses: {},
			refs: {},
			drawers: [],
		}

		this.DrawerController = {
			open: this.open,
			close: this.close,
			closeAll: this.closeAll,
		}

		window.app["DrawerController"] = this.DrawerController
	}

	sendEvent = (id, ...context) => {
		const ref = this.state.refs[id]?.current
		return ref.events.emit(...context)
	}

	open = (id, component, options) => {
		const refs = this.state.refs ?? {}
		const drawers = this.state.drawers ?? []
		const addresses = this.state.addresses ?? {}

		const instance = {
			id,
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
			const ref = refs[id].current
			const isLocked = ref.state.locked

			if (!isLocked) {
				drawers[addresses[id]] = <Drawer {...instance} />
				refs[id] = instance.ref
			} else {
				console.warn("Cannot update an locked drawer.")
			}
		}

		this.setState({ refs, addresses, drawers })
	}

	destroy = (id) => {
		let { addresses, drawers, refs } = this.state
		const index = addresses[id]

		if (typeof drawers[index] !== "undefined") {
			drawers = drawers.filter((value, i) => i !== index)
		}
		delete addresses[id]
		delete refs[id]

		this.setState({ addresses, drawers })
	}

	close = (id) => {
		const ref = this.state.refs[id]?.current

		if (typeof ref !== "undefined") {
			if (ref.state.locked && ref.state.visible) {
				return console.warn("This drawer is locked and cannot be closed")
			} else {
				return ref.close()
			}
		} else {
			return console.warn("This drawer not exists")
		}
	}

	closeAll = () => {
		this.state.drawers.forEach((drawer) => {
			drawer.ref.current.close()
		})
	}

	render() {
		return this.state.drawers
	}
}
