import React from "react"
import { Rnd } from "react-rnd"

import { Icons } from "@components/Icons"

import WindowContext from "./context"

import "./index.less"

export default class DefaultWindowRender extends React.Component {
	static contextType = WindowContext

	ref = React.createRef()

	state = {
		renderError: false,
		visible: false,
		title: null,
		actions: [],
		dimensions: {
			height: this.props.height ?? 600,
			width: this.props.width ?? 400,
		},
		position: this.props.defaultPosition,
	}

	componentDidMount = () => {
		if (!this.state.position) {
			this.setState({ position: this.getCenterPosition() })
		}

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

		this.toggleVisibility(true)
	}

	componentDidCatch = (error) => {
		console.error(error)

		this.setState({
			renderError: error,
		})
	}

	updateTitle = (title) => {
		this.setState({ title })
	}

	updateDimensions = (
		dimensions = {
			width: 0,
			height: 0,
		},
	) => {
		this.ref.current?.updateSize({
			width: dimensions.width,
			height: dimensions.height,
		})
	}

	updatePosition = (
		position = {
			x: 0,
			y: 0,
		},
	) => {
		this.ref.current?.updatePosition({
			x: position.x,
			y: position.y,
		})
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	getCenterPosition = () => {
		const dimensions = this.state?.dimensions ?? {}

		const windowHeight = dimensions.height ?? 600
		const windowWidth = dimensions.width ?? 400

		const y = window.innerHeight / 2 - windowHeight / 2
		const x = window.innerWidth / 2 - windowWidth / 2

		return {
			x: x,
			y: y,
		}
	}

	setDefaultActions = () => {
		const { actions } = this.state

		actions.push({
			key: "close",
			render: () => <Icons.FiXCircle style={{ margin: 0, padding: 0 }} />,
			onClick: () => {
				this.props.close()
			},
		})

		this.setState({ actions })
	}

	renderActions = () => {
		const actions = this.state.actions

		if (Array.isArray(actions)) {
			return actions.map((action) => {
				return (
					<div
						key={action.key}
						onClick={action.onClick}
						{...action.props}
					>
						{React.isValidElement(action.render)
							? action.render
							: React.createElement(action.render)}
					</div>
				)
			})
		}

		return null
	}

	getComponentRender = () => {
		const ctx = {
			...this.props,
			updateTitle: this.updateTitle,
			updateDimensions: this.updateDimensions,
			updatePosition: this.updatePosition,
			close: this.props.close,
			position: this.state.position,
			dimensions: this.state.dimensions,
		}

		return (
			<WindowContext.Provider value={ctx}>
				{React.isValidElement(this.props.children)
					? React.cloneElement(this.props.children, ctx)
					: React.createElement(this.props.children, ctx)}
			</WindowContext.Provider>
		)
	}

	render() {
		const { position, dimensions, visible } = this.state

		if (!visible) {
			return null
		}

		return (
			<Rnd
				ref={this.ref}
				default={{
					...position,
					...dimensions,
				}}
				minWidth={this.props.minWidth}
				minHeight={this.props.minHeight}
				enableResizing={this.props.enableResizing ?? true}
				disableDragging={this.props.disableDragging ?? false}
				dragHandleClassName={
					this.props.dragHandleClassName ?? "window_topbar"
				}
				bounds="body"
				className="window_wrapper"
			>
				<div className="window_topbar">
					<div className="title">{this.state.title}</div>
					<div className="actions">{this.renderActions()}</div>
				</div>

				<div className="window_body">
					{this.state.renderError && (
						<div className="render_error">
							<h1>Render Error</h1>
							<code>{this.state.renderError.message}</code>
						</div>
					)}
					{!this.state.renderError && this.getComponentRender()}
				</div>
			</Rnd>
		)
	}
}
