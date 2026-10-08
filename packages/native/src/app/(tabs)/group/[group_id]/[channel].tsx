import { YStack } from "tamagui"

import AppText from "@/ui/Text"
import ChannelGrid from "@/components/VoiceChannel/Grid"

import { useRTCStore } from "@comty/spaces-sdk/rtc"

const ChannelView = () => {
	const rtc = useRTCStore()

	return (
		<YStack
			flex={1}
			gap={10}
			padding={10}
		>
			<AppText>{rtc.channel?.name ?? rtc.channel?._id}</AppText>

			<ChannelGrid />
		</YStack>
	)
}

export default ChannelView
