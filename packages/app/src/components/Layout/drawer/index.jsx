import React from "react"
import { DraggableDrawer } from "components"
import { EventBus } from "evite"

import "./index.less"

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

export class Drawer extends React.Component {
	options = this.props.options ?? {}
	events = new EventBus()
	state = {
		visible: true,
	}

	componentDidMount = async () => {
		if (typeof this.props.controller === "undefined") {
			throw new Error(`Cannot mount an drawer without an controller`)
		}
		if (typeof this.props.children === "undefined") {
			throw new Error(`Empty component`)
		}
	}

	toogleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	close = () => {
		this.toogleVisibility(false)
		this.events.emit("beforeClose")

		setTimeout(() => {
			if (typeof this.options.onClose === "function") {
				this.options.onClose()
			}

			this.props.controller.destroy(this.props.id)
		}, 500)
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
			...this.options.props,
			ref: this.props.ref,
			key: this.props.id,
			onRequestClose: this.close,
			open: this.state.visible,
			containerElementClass: "drawer",
			modalElementClass: "body",
		}
		const componentProps = {
			...this.options.componentProps,
			events: this.events,
			close: this.close,
			handleDone: this.handleDone,
			handleFail: this.handleFail,
		}

		return <DraggableDrawer {...drawerProps}>
			{React.createElement(this.props.children, componentProps)}
		</DraggableDrawer>
	}
}