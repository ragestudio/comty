import useMediaRTCState from "@hooks/useMediaRTCState"
import { createIconRender } from "@components/Icons"

import CallView from "@pages/@mobile-views/call"

const openCallView = () => {
	app.layout.draggable.open("call", CallView)
}

const CallButton = () => {
	const state = useMediaRTCState()

	React.useEffect(() => {
		if (state.channelId) {
			if (!app.layout.draggable.exists("call")) {
				openCallView()
			}
		} else {
			if (app.layout.draggable.exists("call")) {
				app.layout.draggable.destroy("call")
			}
		}
	}, [state.channelId])

	if (!state.channelId) {
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
