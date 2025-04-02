import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import WidgetsWrapper from "@components/WidgetsWrapper"

import "./index.less"

export default class ToolsBar extends React.Component {
	state = {
		visible: false,
		renders: {
			top: [],
			bottom: [],
		},
	}

	componentDidMount() {
		app.layout.tools_bar = this.interface

		setTimeout(() => {
			this.setState({
				visible: true,
			})
		}, 10)
	}

	componentWillUnmount() {
		delete app.layout.tools_bar
	}

	interface = {
		toggleVisibility: (to) => {
			this.setState({
				visible: to ?? !this.state.visible,
			})
		},
		attachRender: (id, component, props, { position = "bottom" } = {}) => {
			this.setState((prev) => {
				prev.renders[position].push({
					id: id,
					component: component,
					props: props,
				})

				return prev
			})

			return component
		},
		detachRender: (id) => {
			this.setState((prev) => {
				prev.renders.top = prev.renders.top.filter(
					(render) => render.id !== id,
				)
				prev.renders.bottom = prev.renders.bottom.filter(
					(render) => render.id !== id,
				)

				return prev
			})

			return true
		},
	}

	render() {
		const hasAnyRenders =
			this.state.renders.top.length > 0 ||
			this.state.renders.bottom.length > 0

		const isVisible = hasAnyRenders && this.state.visible

		return (
			<AnimatePresence>
				{isVisible && (
					<motion.div
						className={classnames("tools-bar-wrapper", {
							["visible"]: isVisible,
						})}
						animate={{
							x: 0,
							width: "100%",
						}}
						initial={{
							x: 100,
							width: "0%",
						}}
						exit={{
							x: 100,
							width: "0%",
						}}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
						}}
					>
						<div id="tools_bar" className="tools-bar">
							<div className="attached_renders top">
								{this.state.renders.top.map((render, index) => {
									return React.createElement(
										render.component,
										{
											...render.props,
											key: index,
											id: render.id,
										},
									)
								})}
							</div>

							<WidgetsWrapper />

							<div className="attached_renders bottom">
								{this.state.renders.bottom.map(
									(render, index) => {
										return React.createElement(
											render.component,
											{
												...render.props,
												key: index,
											},
										)
									},
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		)
	}
}
