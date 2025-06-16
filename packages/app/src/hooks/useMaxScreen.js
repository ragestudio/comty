import React from "react"

export default () => {
	const enterPlayerAnimation = () => {
		app.controls.toggleUIVisibility(false)
	}

	const exitPlayerAnimation = () => {
		app.controls.toggleUIVisibility(true)
	}

	React.useEffect(() => {
		enterPlayerAnimation()

		return () => {
			exitPlayerAnimation()
		}
	}, [])
}
