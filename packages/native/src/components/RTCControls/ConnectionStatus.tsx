import React from "react"
import { useTheme, XStack, YStack } from "tamagui"

import AppText from "@/ui/Text"
import { useRTCStore } from "@comty/spaces-sdk/rtc"

export const TRANSPORT_STATE_LABELS: Record<string, string> = {
	new: "Starting",
	connecting: "Connecting",
	connected: "Connected",
	failed: "Failed",
	closed: "Closed",
	disconnected: "Disconnected",
}

type ConnectionStatusProps = {
	onPress?: () => void
}

export const ConnectionStatus = ({ onPress }: ConnectionStatusProps) => {
	const theme = useTheme()

	const state = useRTCStore((store) => store.state)
	const sendState = useRTCStore((store) => store.sendTransportState)

	const loading = state === "loading"
	const label = loading
		? "Connecting"
		: (TRANSPORT_STATE_LABELS[sendState] ?? sendState)

	const connected = sendState === "connected"
	const failed = sendState === "failed" || sendState === "closed"
	const color = connected
		? theme.productColor?.val
		: failed
			? theme.colorError?.val
			: theme.color?.val

	return (
		<XStack
			alignItems="center"
			gap={5}
			onPress={onPress}
			pressStyle={onPress ? { opacity: 0.6 } : undefined}
		>
			<YStack
				width={7}
				height={7}
				borderRadius={4}
				backgroundColor={color}
				opacity={connected || failed ? 1 : 0.5}
			/>
			<AppText
				fontSize={11}
				color={color}
				opacity={connected || failed ? 1 : 0.6}
			>
				{label}
			</AppText>
		</XStack>
	)
}

export default ConnectionStatus
