import React from "react"

const usePageWidgets = (widgets = []) => {
	React.useEffect(() => {
		if (
			!app.layout.tools_bar ||
			!app.layout.tools_bar.attachRender ||
			!app.layout.tools_bar.detachRender
		) {
			return
		}

		for (const widget of widgets) {
			app.layout.tools_bar.attachRender(
				widget.id,
				widget.component,
				widget.props,
				{
					position: "top",
				},
			)
		}

		return () => {
			for (const widget of widgets) {
				app.layout.tools_bar.detachRender(widget.id)
			}
		}
	})
}

export default usePageWidgets
