import React from "react"

import useToolsBarRenders from "@hooks/useToolsBarRenders"
import useLayoutInterface from "@hooks/useLayoutInterface"

const ToolsBar = () => {
	const { topRenders, bottomRenders, setTopRenders, setBottomRenders } =
		useToolsBarRenders()

	useLayoutInterface("tools_bar", {
		toggleVisibility: (to) => {
			setVisible((prev) => {
				return to ?? !prev
			})
		},
		attachRender: (id, component, props, { position = "bottom" } = {}) => {
			let stateUpdater = setBottomRenders

			if (position === "top") {
				stateUpdater = setTopRenders
			}

			if (position === "bottom") {
				stateUpdater = setBottomRenders
			}

			stateUpdater((prev) => {
				return [
					...prev,
					{
						id: id,
						component: component,
						props: props,
					},
				]
			})

			return component
		},
		detachRender: (id) => {
			setTopRenders((prev) => {
				return prev.filter((render) => render.id !== id)
			})

			setBottomRenders((prev) => {
				return prev.filter((render) => render.id !== id)
			})

			return true
		},
	})

	return [...bottomRenders, ...topRenders]
		.filter((item) => {
			if (item.id === "mediartc-channel") {
				return false
			}
			return true
		})
		.map((render, index) => {
			return React.createElement(render.component, {
				...render.props,
				key: index,
			})
		})
}

export default ToolsBar
