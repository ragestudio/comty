import React from "react"
import classnames from "classnames"
import { Motion, spring } from "react-motion"

import "./index.less"

export class Sidedrawer extends React.Component {
	state = {
		visible: false,
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	render() {
		return <Motion style={{
			x: spring(!this.state.visible ? 100 : 0),
			opacity: spring(!this.state.visible ? 0 : 1),
		}}>
			{({ x, opacity }) => {
				return <div
					key={this.props.id}
					id={this.props.id}
					className={classnames(
						"sidedrawer",
						{
							"first": this.props.first
						}
					)}
					style={{
						...this.props.style,
						transform: `translateX(-${x}%)`,
						opacity: opacity,
					}}

				>
					{
						React.createElement(this.props.children, {
							...this.props.props,
							close: this.props.close,
						})
					}
				</div>
			}}
		</Motion>
	}
}

export default class SidedrawerController extends React.Component {
	constructor(props) {
		super(props)

		this.interface = app.layout.sidedrawer = {
			open: this.open,
			close: this.close,
			closeAll: this.closeAll,
			hasDrawers: this.state.drawers.length > 0,
			toggleGlobalVisibility: () => {
				this.setState({
					globalVisible: !this.state.globalVisible,
				})
			}
		}
	}

	state = {
		globalVisible: true,
		drawers: [],
		lockedIds: [],
	}

	componentDidMount = () => {
		this.listenEscape()
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

		const drawers = this.state.drawers

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

		const drawerProps = {
			id: id,
			allowMultiples: options.allowMultiples ?? false,
			escClosable: options.escClosable ?? true,
			first: drawers.length === 0,
			style: {
				zIndex: 100 - drawers.length,
			},
			ref: React.createRef(),
			close: this.close,
			lock: () => this.lockDrawerId(id),
			unlock: () => this.unlockDrawer(id),
		}

		drawers.push(React.createElement(Sidedrawer, drawerProps, component))

		if (options.lock) {
			this.lockDrawerId(id)
		}

		await this.setState({
			drawers,
		})

		setTimeout(() => {
			this.toggleDrawerVisibility(id, true)
		}, 10)

		window.app.eventBus.emit("sidedrawer.open")

		if (this.state.drawers.length > 0) {
			app.eventBus.emit("sidedrawers.visible", true)
		}
	}

	toggleDrawerVisibility = (id, to) => {
		// find drawer
		const drawer = this.state.drawers.find(drawer => drawer.props.id === id)

		if (!drawer) {
			console.warn(`Sidedrawer with id "${id}" does not exist.`)
			return
		}

		if (!drawer.ref.current) {
			console.warn(`Sidedrawer with id "${id}" has not valid ref.`)
			return
		}

		return drawer.ref.current.toggleVisibility(to)
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

		// toggleVisibility off
		this.toggleDrawerVisibility(drawerId, false)

		// await drawer transition
		setTimeout(() => {
			// remove drawer
			drawers = drawers.filter(drawer => drawer.props.id !== drawerId)

			this.setState({ drawers })

			if (this.state.drawers.length === 0) {
				app.eventBus.emit("sidedrawers.visible", false)
			}
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
					["hidden"]: !this.state.drawers.length || this.state.globalVisible,
				}
			)}
		>
			{this.state.drawers}
		</div>
	}
}