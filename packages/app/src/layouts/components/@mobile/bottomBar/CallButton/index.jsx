import React from "react"
import useRTCStore from "@comty/spaces-sdk/rtc"
import { createIconRender } from "@components/Icons"

import CallView from "@pages/@mobile-views/call"

const openCallView = () => {
	app.layout.draggable.open("call", CallView)
}

const CallButton = () => {
	const state = useRTCStore()

	React.useEffect(() => {
		if (state.channel?._id) {
			if (!app.layout.draggable.exists("call")) {
				openCallView()
			}
		} else {
			if (app.layout.draggable.exists("call")) {
				app.layout.draggable.destroy("call")
			}
		}
	}, [state.channel])

	if (!state.channel?._id) {
		return null
	}

	return (
		<div
			key="call_button"
			id="call_button"
			className="item"
			onClick={openCallView}
		>
			<div className="icon">{createIconRender("Phone")}</div>
		</div>
	)
}

export default CallButton
