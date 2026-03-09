import React from "react"
import { LayoutContext } from "@/layout"

const useToolsBarRenders = () => {
	const layoutContext = React.useContext(LayoutContext)

	const [mounted, setMounted] = React.useState(false)
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

		setMounted(true)
	}, [])

	// update renders to context
	React.useEffect(() => {
		if (!mounted) {
			return
		}

		if (layoutContext && layoutContext.interfacesProperties) {
			if (!layoutContext.interfacesProperties["tools_bar"]) {
				layoutContext.interfacesProperties["tools_bar"] = {}
			}

			if (Array.isArray(topRenders)) {
				layoutContext.interfacesProperties["tools_bar"].topRenders =
					topRenders
			}

			if (Array.isArray(bottomRenders)) {
				layoutContext.interfacesProperties["tools_bar"].bottomRenders =
					bottomRenders
			}
		}
	}, [topRenders, bottomRenders, mounted])

	return {
		topRenders,
		bottomRenders,
		setTopRenders,
		setBottomRenders,
		mounted,
		setMounted,
	}
}

export default useToolsBarRenders
