import type { PressHandler } from "@/types"

import { useTheme, View, XStack, YStack } from "tamagui"
import { RTCView } from "react-native-webrtc"
import { Maximize2Icon, TvMinimalPlayIcon, XIcon } from "lucide-react-native"
import { Slider } from "panelui-native"

import AppText from "@/ui/Text"
import TileButton from "./TileButton"

export const ScreenViewTile = ({
	width,
	height,
	streamURL,
	label,
	hasAudio,
	volume,
	onVolume,
	onStop,
	onExpand,
	onPress,
	hidden,
}: {
	width: number
	height: number
	streamURL: string | null
	label: string
	hasAudio?: boolean
	volume?: number
	onVolume?: (value: number) => void
	onStop: () => void
	onExpand?: () => void
	onPress: PressHandler
	hidden?: boolean
}) => {
	const theme = useTheme()

	return (
		<YStack
			width={width}
			height={height}
			borderRadius={12}
			overflow="hidden"
			backgroundColor="black"
			justifyContent="center"
			onPress={onPress}
		>
			{hidden ? null : streamURL ? (
				<RTCView
					key={streamURL}
					streamURL={streamURL}
					objectFit="contain"
					style={{ flex: 1 }}
				/>
			) : (
				<XStack
					alignItems="center"
					justifyContent="center"
					gap={8}
				>
					<TvMinimalPlayIcon
						size={20}
						color={theme.textColor?.val}
					/>
					<AppText
						fontSize={13}
						opacity={0.7}
					>
						connecting...
					</AppText>
				</XStack>
			)}

			<View
				style={{
					position: "absolute",
					top: 6,
					left: 6,
					maxWidth: width - (onExpand ? 76 : 50),
				}}
			>
				<XStack
					alignItems="center"
					gap={4}
					paddingVertical={3}
					paddingHorizontal={6}
					borderRadius={6}
					backgroundColor="rgba(0,0,0,0.5)"
				>
					<AppText
						fontSize={11}
						numberOfLines={1}
					>
						{label}
					</AppText>
				</XStack>
			</View>

			<View style={{ position: "absolute", top: 6, right: 6 }}>
				<XStack gap={6}>
					{onExpand && (
						<TileButton
							onPress={(event) => {
								event.stopPropagation()
								onExpand()
							}}
						>
							<Maximize2Icon
								size={14}
								color={theme.textColor?.val}
							/>
						</TileButton>
					)}

					<TileButton
						onPress={(event) => {
							event.stopPropagation()
							onStop()
						}}
					>
						<XIcon
							size={14}
							color={theme.textColor?.val}
						/>
					</TileButton>
				</XStack>
			</View>

			{hasAudio && onVolume && (
				<View
					style={{
						position: "absolute",
						width: "30%",
						left: 6,
						right: 6,
						bottom: 6,
						paddingHorizontal: 8,
						paddingVertical: 2,
						borderRadius: 8,
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				>
					<Slider
						size="sm"
						min={0}
						max={100}
						step={1}
						defaultValue={volume}
						onValueCommit={onVolume}
						haptics
					/>
				</View>
			)}
		</YStack>
	)
}

export default ScreenViewTile
