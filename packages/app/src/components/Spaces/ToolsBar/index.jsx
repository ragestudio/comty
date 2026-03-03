import React from "react"
import { LayoutContext } from "@/layout"
import useLayoutInterface from "@hooks/useLayoutInterface"

const ToolsBar = () => {
	const layoutContext = React.useContext(LayoutContext)

	const [topRenders, setTopRenders] = React.useState([])
	const [bottomRenders, setBottomRenders] = React.useState([])

	// restore renders from context
	React.useEffect(() => {
		if (
			layoutContext &&
			layoutContext.interfacesProperties &&
			layoutContext.interfacesProperties["tools_bar"]
		) {
			if (layoutContext.interfacesProperties["tools_bar"]["topRenders"]) {
				setTopRenders(
					layoutContext.interfacesProperties["tools_bar"][
						"topRenders"
					],
				)
			}

			if (
				layoutContext.interfacesProperties["tools_bar"]["bottomRenders"]
			) {
				setBottomRenders(
					layoutContext.interfacesProperties["tools_bar"][
						"bottomRenders"
					],
				)
			}
		}
	}, [])

	// update renders to context
	React.useEffect(() => {
		if (layoutContext && layoutContext.interfacesProperties) {
			if (!layoutContext.interfacesProperties["tools_bar"]) {
				layoutContext.interfacesProperties["tools_bar"] = {}
			}

			layoutContext.interfacesProperties["tools_bar"] = {
				topRenders: topRenders,
				bottomRenders: bottomRenders,
			}
		}
	}, [topRenders, bottomRenders])

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
