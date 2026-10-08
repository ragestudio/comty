import type { PressHandler } from "@/types"
import React from "react"
import { YStack } from "tamagui"

export const TileButton = ({
	onPress,
	children,
}: {
	onPress: PressHandler
	children: React.ReactNode
}) => (
	<YStack
		width={28}
		height={28}
		alignItems="center"
		justifyContent="center"
		borderRadius={14}
		backgroundColor="rgba(0,0,0,0.5)"
		onPress={onPress}
	>
		{children}
	</YStack>
)

export default TileButton
