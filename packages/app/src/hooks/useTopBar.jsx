import React from "react"

import { setTopBarRender, useTopBarStore } from "@/stores/topbar"

export default (props) => {
	React.useEffect(() => {
		setTopBarRender(
			<React.Fragment>{props.children}</React.Fragment>,
			props.options,
		)
	}, [props.children, props.options])

	React.useEffect(() => {
		return () => {
			useTopBarStore.getState().clearRender()
		}
	}, [])

	return null
}
