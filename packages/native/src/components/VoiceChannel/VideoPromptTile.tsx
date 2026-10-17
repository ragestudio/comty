import type { PressHandler } from "@/types"

import { useTheme, YStack } from "tamagui"
import { TvMinimalPlayIcon } from "lucide-react-native"
import AppText from "@/ui/Text"
import TileFrame from "./TileFrame"

export const VideoPromptTile = ({
	width,
	height,
	label,
	hint = "tap to watch",
	onPress,
}: {
	width: number
	height: number
	label: string
	hint?: string
	onPress: PressHandler
}) => {
	const theme = useTheme()

	return (
		<TileFrame
			width={width}
			height={height}
			onPress={onPress}
		>
			<TvMinimalPlayIcon
				size={26}
				color={theme.productColor.val}
			/>

			<YStack
				alignItems="center"
				gap={2}
				maxWidth="100%"
			>
				<AppText
					fontSize={12}
					numberOfLines={1}
				>
					{label}
				</AppText>
				<AppText
					fontSize={10}
					opacity={0.5}
				>
					{hint}
				</AppText>
			</YStack>
		</TileFrame>
	)
}

export default VideoPromptTile
