import React from "react"
import { Rnd } from "react-rnd"

import { Icons } from "@components/Icons"

import WindowContext from "./context"

import "./index.less"

export default class DefaultWindowRender extends React.Component {
	static contextType = WindowContext

	rndRef = React.createRef()

	state = {
		renderError: false,
		visible: false,
		title: null,
		actions: [],
	}

	dragPos = this.props.defaultPosition || { x: 0, y: 0 }
	dragSize = {
		width: this.props.width ?? 400,
		height: this.props.height ?? 600,
	}

	componentDidMount = () => {
		if (!this.props.defaultPosition) {
			this.dragPos = {
				x: (window.innerWidth - this.dragSize.width) / 2,
				y: (window.innerHeight - this.dragSize.height) / 2,
			}
		}

		this.setDefaultActions()

		if (Array.isArray(this.props.actions)) {
			const actions = [...(this.state.actions ?? [])]
			this.props.actions.forEach((action) => actions.push(action))
			this.setState({ actions })
		}

		this.toggleVisibility(true)
	}

	componentDidCatch = (error) => {
		console.error(error)
		this.setState({ renderError: error })
	}

	updateTitle = (title) => {
		this.setState({ title })
	}

	updateDimensions = (dimensions = { width: 0, height: 0 }) => {
		this.dragSize = {
			width: dimensions.width,
			height: dimensions.height,
		}
		this.rndRef.current?.updateSize({
			width: dimensions.width,
			height: dimensions.height,
		})
	}

	updatePosition = (position = { x: 0, y: 0 }) => {
		this.dragPos = { x: position.x, y: position.y }
		this.rndRef.current?.updatePosition({
			x: position.x,
			y: position.y,
		})
	}

	toggleVisibility = (to) => {
		this.setState({ visible: to ?? !this.state.visible })
	}

	setDefaultActions = () => {
		const actions = [...this.state.actions]

		actions.push({
			key: "close",
			render: () => <Icons.CircleX style={{ margin: 0, padding: 0 }} />,
			onClick: () => {
				this.props.close()
			},
		})

		this.setState({ actions })
	}

	handleDragStop = (_e, d) => {
		this.dragPos = { x: d.x, y: d.y }
	}

	handleResizeStop = (_e, _direction, ref, _delta, position) => {
		this.dragPos = { x: position.x, y: position.y }
		this.dragSize = {
			width: ref.offsetWidth,
			height: ref.offsetHeight,
		}
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
			position: this.dragPos,
			dimensions: this.dragSize,
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
		const { visible } = this.state

		if (!visible) {
			return null
		}

		return (
			<Rnd
				ref={this.rndRef}
				default={{
					...this.dragPos,
					...this.dragSize,
				}}
				onDragStop={this.handleDragStop}
				onResizeStop={this.handleResizeStop}
				minWidth={this.props.minWidth}
				minHeight={this.props.minHeight}
				enableResizing={this.props.enableResizing ?? true}
				disableDragging={this.props.disableDragging ?? false}
				dragHandleClassName={
					this.props.dragHandleClassName ?? "window_topbar"
				}
				bounds="window"
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
