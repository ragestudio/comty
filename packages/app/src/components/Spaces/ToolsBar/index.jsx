import React from "react"

import useLayoutInterface from "@hooks/useLayoutInterface"
import useToolsBarStore from "@/stores/toolsbar"

const ToolsBar = (props) => {
	const store = useToolsBarStore()

	useLayoutInterface("tools_bar", store)

	return [...store.renders.bottom, ...store.renders.top]
		.filter((item) => {
			if (
				Array.isArray(props.filters) &&
				props.filters.includes(item.id)
			) {
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
