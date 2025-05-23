import React from "react"
import { Drawer } from "vaul"

import ActionsMenu from "../@mobile/actionsMenu"

import "./index.less"

export class DraggableDrawerController extends React.Component {
	constructor(props) {
		super(props)

		this.interface = {
			open: this.open,
			destroy: this.destroy,
			actions: this.actions,
			exists: this.exists,
		}

		this.state = {
			drawers: [],
		}
	}

	componentDidMount() {
		app.layout.draggable = this.interface
	}

	async handleDrawerOnClosed(drawer) {
		if (!drawer) {
			return false
		}

		if (typeof drawer.options.onClosed === "function") {
			await drawer.options.onClosed()
		}

		this.destroy(drawer.id)
	}

	actions = (data) => {
		const win = this.open("actions-menu", ActionsMenu, {
			componentProps: {
				...data,
			},
		})

		return win
	}

	open = (id, render, options = {}) => {
		let drawerObj = {
			id: id,
			render: render,
			options: options,
		}

		const win = app.cores.window_mng.render(
			id,
			<DraggableDrawer
				options={options}
				onClosed={() => this.handleDrawerOnClosed(drawerObj)}
			>
				{React.createElement(render, {
					...options.componentProps,
				})}
			</DraggableDrawer>,
		)

		drawerObj.winId = win.id

		this.setState({
			drawers: [...this.state.drawers, drawerObj],
		})

		return {
			...drawerObj,
			close: () => this.destroy(id),
		}
	}

	destroy = (id) => {
		const drawerIndex = this.state.drawers.findIndex(
			(drawer) => drawer.id === id,
		)

		if (drawerIndex === -1) {
			console.error(`Drawer [${id}] not found`)
			return false
		}

		const drawer = this.state.drawers[drawerIndex]

		if (drawer.locked === true) {
			console.error(`Drawer [${drawer.id}] is locked`)
			return false
		}

		const drawers = this.state.drawers

		drawers.splice(drawerIndex, 1)

		this.setState({ drawers: drawers })

		app.cores.window_mng.close(drawer.id ?? id)
	}

	exists = (id) => {
		return this.state.drawers.findIndex((drawer) => drawer.id === id) !== -1
	}

	/**
	 * This lifecycle method is called after the component has been updated.
	 * It will toggle the root scale effect based on the amount of drawers.
	 * If there are no drawers, the root scale effect is disabled.
	 * If there are one or more drawers, the root scale effect is enabled.
	 */
	componentDidUpdate() {
		if (this.state.drawers.length === 0) {
			app.layout.toggleRootScaleEffect(false)
		} else {
			app.layout.toggleRootScaleEffect(true)
		}
	}

	render() {
		return null
	}
}

export const DraggableDrawer = (props) => {
	const [isOpen, setIsOpen] = React.useState(true)

	async function handleOnOpenChanged(to) {
		if (to === true) {
			return to
		}

		setIsOpen(false)

		if (typeof props.onClosed === "function") {
			setTimeout(() => {
				props.onClosed()
			}, 350)
		}

		return to
	}

	return (
		<Drawer.Root open={isOpen} onOpenChange={handleOnOpenChanged}>
			<Drawer.Portal>
				<Drawer.Overlay className="app-drawer-overlay" />

				<Drawer.Content
					className="app-drawer-content"
					onInteractOutside={() => {
						setIsOpen(false)
					}}
				>
					<Drawer.Handle className="app-drawer-handle" />

					<Drawer.Title className="app-drawer-title">
						{props.options?.title ?? "Drawer Title"}
					</Drawer.Title>

					{React.cloneElement(props.children, {
						close: () => setIsOpen(false),
					})}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	)
}
