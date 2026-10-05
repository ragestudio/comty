import React from "react"

import useRTCStore, { rtcService } from "@/lib/spaces/stores/rtc"
import TextureBg from "@/ui/TextureBg"
import { XStack, YStack } from "tamagui"
import AppText from "@/ui/Text"
import AppButton from "@/ui/Button"
import {
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	Volume2Icon,
	VolumeOffIcon,
} from "lucide-react-native"

const RTCControls = () => {
	const rtc = useRTCStore()

	const handleLeaveChannel = () => {
		rtcService.handlers.leaveChannel()
	}

	const handleToggleMute = () => {
		rtcService.self.toggleMute()
	}

	const handleToggleDeafened = () => {
		rtcService.self.toggleDeafened()
	}

	return (
		<YStack
			flex={1}
			padding={10}
		>
			<TextureBg
				borderWidth={1}
				borderRadius={12}
			/>
			<AppText>{rtc.state}</AppText>

			<XStack
				width={"100%"}
				alignItems="center"
				justifyContent="space-evenly"
			>
				<AppButton
					width="fit-content"
					children={rtc.isMuted ? <MicOffIcon /> : <MicIcon />}
					onPress={handleToggleMute}
				/>
				<AppButton
					width="fit-content"
					children={rtc.isDeafened ? <VolumeOffIcon /> : <Volume2Icon />}
					onPress={handleToggleDeafened}
				/>
				<AppButton
					width="fit-content"
					children={<PhoneOffIcon />}
					onPress={handleLeaveChannel}
				/>
			</XStack>
		</YStack>
	)
}

export default RTCControls
