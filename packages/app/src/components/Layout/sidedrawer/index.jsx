import React from "react"
import classnames from "classnames"

import "./index.less"

export const Sidedrawer = (props) => {
	const sidedrawerId = props.id ?? props.key

	return <div
		key={sidedrawerId}
		id={sidedrawerId}
		style={props.style}
		className={
			classnames("sidedrawer", {
				"hided": !props.defaultVisible,
				"first": props.first
			})
		}
	>
		{
			React.createElement(props.children, {
				...props.props,
				close: props.close,
			})
		}
	</div>
}

export default class SidedrawerController extends React.Component {
	state = {
		drawers: [],
		lockedIds: [],
	}

	constructor(props) {
		super(props)

		this.controller = window.app["SidedrawerController"] = {
			open: this.open,
			close: this.close,
			closeAll: this.closeAll,
			hasDrawers: this.state.drawers.length > 0,
		}
	}

	componentDidMount = () => {
		this.listenEscape()
	}

	componentDidUpdate() {
		this.controller.hasDrawers = this.state.drawers.length > 0

		if (this.controller.hasDrawers) {
			window.app.eventBus.emit("sidedrawer.hasDrawers")
		} else {
			window.app.eventBus.emit("sidedrawer.noDrawers")
		}
	}

	componentWillUnmount = () => {
		this.unlistenEscape()
	}

	drawerIsLocked = (id) => {
		return this.state.lockedIds.includes(id)
	}

	lockDrawerId = (id) => {
		this.setState({
			lockedIds: [...this.state.lockedIds, id],
		})
	}

	unlockDrawer = (id) => {
		this.setState({
			lockedIds: this.state.lockedIds.filter(lockedId => lockedId !== id),
		})
	}

	open = async (id, component, options = {}) => {
		if (typeof id !== "string") {
			options = component
			component = id
			id = component.key ?? component.id ?? Math.random().toString(36).substr(2, 9)
		}

		let drawers = this.state.drawers

		// check if id is already in use
		// but only if its allowed to be used multiple times
		const existentDrawer = drawers.find((drawer) => drawer.props.id === id)

		if (existentDrawer) {
			if (!existentDrawer.props.allowMultiples) {
				console.warn(`Sidedrawer with id "${id}" already exists.`)
				return false
			}

			// fix id appending the corresponding array index at the end of the id
			// ex ["A", "B", "C"] => ["A", "B", "C", "A-1"]
			// to prevent id collisions

			let index = 0
			let newId = id

			while (drawers.find(drawer => drawer.props.id === newId)) {
				index++
				newId = id + "-" + index
			}

			id = newId
		}

		drawers.push(React.createElement(
			Sidedrawer,
			{
				key: id,
				id: id,
				first: drawers.length === 0,
				style: {
					zIndex: 100 - drawers.length,
				},
				allowMultiples: options.allowMultiples ?? false,
				...options.props,
				close: this.close,
				escClosable: options.escClosable ?? true,
				defaultVisible: false,
				selfLock: () => {
					this.lockDrawerId(id)
				},
				selfUnlock: () => {
					this.unlockDrawer(id)
				}
			},
			component
		))

		if (options.lock) {
			this.lockDrawerId(id)
		}

		await this.setState({ drawers })

		setTimeout(() => {
			this.toggleDrawerVisibility(id, true)
		}, 10)

		window.app.eventBus.emit("sidedrawer.open")
	}

	toggleDrawerVisibility = (id, to) => {
		const drawer = document.getElementById(id)
		const drawerClasses = drawer.classList

		if (to) {
			app.cores.sound.useUIAudio("sidebar.expand")

			drawerClasses.remove("hided")
		} else {
			app.cores.sound.useUIAudio("sidebar.collapse")

			drawerClasses.add("hided")
		}
	}

	close = (id) => {
		// if an id is provided filter by key
		// else close the last opened drawer
		let drawers = this.state.drawers
		let drawerId = id ?? drawers[drawers.length - 1].props.id

		// check if id is locked
		if (this.drawerIsLocked(id)) {
			console.warn(`Sidedrawer with id "${id}" is locked.`)
			return false
		}

		// check if id exists
		const drawer = drawers.find(drawer => drawer.props.id === drawerId)

		if (!drawer) {
			console.warn(`Sidedrawer with id "${id}" does not exist.`)
			return false
		}

		// emit event
		window.app.eventBus.emit("sidedrawer.close")

		// toogleVisibility off
		this.toggleDrawerVisibility(drawerId, false)

		// await drawer transition
		setTimeout(() => {
			// remove drawer
			drawers = drawers.filter(drawer => drawer.props.id !== drawerId)

			this.setState({ drawers })
		}, 500)
	}

	listenEscape = () => {
		document.addEventListener("keydown", this.handleEscKeyPress)
	}

	unlistenEscape = () => {
		document.removeEventListener("keydown", this.handleEscKeyPress)
	}

	handleEscKeyPress = (event) => {
		// avoid handle keypress when is nothing to render
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
			// close the last opened drawer
			this.close()
		}
	}

	render() {
		return <div
			className={classnames(
				"sidedrawers-wrapper",
				{
					["floating-sidebar"]: window.app?.cores.settings.get("sidebar.floating")
				}
			)}
		>
			{this.state.drawers}
		</div>
	}
}