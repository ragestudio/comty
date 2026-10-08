import type { PressHandler } from "@/types"

import TextureBg from "@/ui/TextureBg"
import { YStack } from "tamagui"

export const TileFrame = ({
	width,
	height,
	active,
	onPress,
	children,
}: {
	width: number
	height: number
	active?: boolean
	onPress?: PressHandler
	children: React.ReactNode
}) => (
	<YStack
		width={width}
		height={height}
		borderRadius={24}
		overflow="hidden"
		alignItems="center"
		justifyContent="center"
		gap={8}
		padding={8}
		onPress={onPress}
	>
		<TextureBg
			blurIntensity={0}
			borderRadius={24}
			borderWidth={active ? 2 : 1}
			borderColor={active ? "$productColor" : "$borderColor"}
		/>
		{children}
	</YStack>
)

export default TileFrame
