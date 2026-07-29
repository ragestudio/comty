import type { StatedChannel } from "../../collections/channel"

import React from "react"
import GroupsModel from "@models/groups"

export const useRTCChannels = (group_id: string) => {
	const [statedChannels, setStatedChannels] = React.useState<
		Record<string, StatedChannel>
	>({})

	const syncStatedRTCChannels = React.useCallback(async () => {
		console.debug("[rtc] gathering state")

		const state = (await GroupsModel.rtc.getGroupState(
			group_id,
		)) as StatedChannel[]

		console.debug("[rtc] gathered state:", state)

		if (Array.isArray(state)) {
			setStatedChannels(
				state.reduce(
					(
						curr: Record<string, StatedChannel>,
						channel: StatedChannel,
					) => {
						curr[channel._id] = channel
						return curr
					},
					{},
				),
			)
		}

		return state
	}, [group_id])

	return { statedChannels, setStatedChannels, syncStatedRTCChannels }
}
