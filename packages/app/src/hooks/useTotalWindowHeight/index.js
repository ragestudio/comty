import React from "react"

export default (to) => {
	React.useEffect(() => {
		if (typeof to !== "undefined") {
			app.layout.toggleTotalWindowHeight(to)

			return () => {
				app.layout.toggleTotalWindowHeight(!!to)
			}
		}

		app.layout.toggleTotalWindowHeight(true)

		return () => {
			app.layout.toggleTotalWindowHeight(false)
		}
	}, [])
}
