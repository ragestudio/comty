import React from "react"

export default (to) => {
	React.useEffect(() => {
		if (typeof to !== "undefined") {
			app.layout.toggleCenteredContent(to)

			return () => {
				app.layout.toggleCenteredContent(!!to)
			}
		}

		app.layout.toggleCenteredContent(true)

		return () => {
			app.layout.toggleCenteredContent(false)
		}
	}, [])
}
