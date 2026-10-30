import React from "react"
import useToolsBarStore from "@/stores/toolsbar"

const usePageWidgets = (widgets = []) => {
	const store = useToolsBarStore()

	React.useEffect(() => {
		if (!store || !store.attachRender || !store.detachRender) {
			return
		}

		for (const widget of widgets) {
			store.attachRender(widget.id, widget.component, widget.props, {
				position: "top",
			})
		}

		return () => {
			for (const widget of widgets) {
				store.detachRender(widget.id)
			}
		}
	}, [])
}

export default usePageWidgets
