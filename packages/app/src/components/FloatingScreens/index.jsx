import React from "react"

import StreamTile from "@components/Spaces/StreamTile"
import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"

import "./index.less"

const FloatingScreens = () => {
	const rtc = useRTCStore()

	const screen = React.useMemo(() => {
		if (rtc.localScreenStream) {
			return {
				id: "local-screen",
				userId: app.userData?._id,
				isSelf: true,
				mediaStream: rtc.localScreenStream,
			}
		}

		const remote = (rtc.statedScreens ?? []).find(
			(item) => item.enabled && item.stream,
		)

		if (!remote) return null

		return {
			id: `screen:${remote.userId}`,
			userId: remote.userId,
			isSelf: false,
			mediaStream: remote.stream,
			volume: remote.volume,
			onStop: () => rtcService.screens.disable(remote.userId),
			onVolume: (value) =>
				rtcService.screens.setVolume(remote.userId, value),
		}
	}, [rtc.localScreenStream, rtc.statedScreens])

	const channel = rtc.channel

	if (!screen || !channel) {
		return null
	}

	const onClickScreen = () => {
		app.location.push(
			`/spaces/group/${channel.group_id}/${channel._id}/voice`,
		)
	}

	return (
		<div
			className="floating-screens"
			onClick={onClickScreen}
		>
			<StreamTile stream={screen} />
		</div>
	)
}

export default FloatingScreens
