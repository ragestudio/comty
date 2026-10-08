import type { PressHandler } from "@/types"

import { TvMinimalPlayIcon } from "lucide-react-native"
import { useTheme, YStack } from "tamagui"
import AppText from "@/ui/Text"
import TileFrame from "./TileFrame"

export const ScreenPromptTile = ({
	width,
	height,
	label,
	onPress,
}: {
	width: number
	height: number
	label: string
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
					tap to watch
				</AppText>
			</YStack>
		</TileFrame>
	)
}

export default ScreenPromptTile
