import React from "react"

import { useGroupRTC } from "@/lib/spaces"
import useRTCStore from "@/lib/spaces/stores/rtc"
import AppText from "@/ui/Text"
import { YStack } from "tamagui"
import { GroupChannelsClients } from "."

const ChannelView = () => {
	const rtc = useRTCStore()
	const channelState = useGroupRTC()

	const current = React.useMemo(() => {
		if (rtc.channel?._id) {
			return channelState[rtc.channel?._id]
		}

		return null
	}, [rtc.channel?._id])

	console.log(current)

	return (
		<YStack>
			<AppText>{rtc.channel?._id}</AppText>

			{current?.clients && <GroupChannelsClients clients={current?.clients} />}
		</YStack>
	)
}

export default ChannelView
