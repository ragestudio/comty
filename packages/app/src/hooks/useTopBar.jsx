import React from "react"

export default (props) => {
	if (!app.layout?.top_bar) {
		return null
	}

	app.layout.top_bar.render(
		<React.Fragment>{props.children}</React.Fragment>,
		props.options,
	)

	React.useEffect(() => {
		return () => {
			app.layout.top_bar.renderDefault()
		}
	}, [])

	return null
}
