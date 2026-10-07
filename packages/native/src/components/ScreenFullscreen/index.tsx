import React from "react"
import { StatusBar, StyleSheet, View } from "react-native"
import { RTCView } from "react-native-webrtc"
import * as ScreenOrientation from "expo-screen-orientation"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme, XStack, YStack } from "tamagui"
import { Minimize2Icon, TvMinimalPlayIcon } from "lucide-react-native"
import { Slider } from "panelui-native"

import AppText from "@/ui/Text"
import { useScreenFullscreen } from "@/stores/ScreenFullscreen"

const ScreenFullscreen = () => {
	const payload = useScreenFullscreen().payload
	const theme = useTheme()
	const insets = useSafeAreaInsets()

	const active = payload !== null

	React.useEffect(() => {
		const lock = active
			? ScreenOrientation.OrientationLock.ALL
			: ScreenOrientation.OrientationLock.PORTRAIT_UP

		ScreenOrientation.lockAsync(lock).catch(console.error)
		StatusBar.setHidden(active, "fade")
	}, [active])

	React.useEffect(() => {
		return () => {
			ScreenOrientation.lockAsync(
				ScreenOrientation.OrientationLock.PORTRAIT_UP,
			).catch(console.error)
			StatusBar.setHidden(false, "fade")
		}
	}, [])

	if (!payload) return null

	return (
		<View style={[StyleSheet.absoluteFill, styles.container]}>
			{payload.streamURL && (
				<RTCView
					streamURL={payload.streamURL}
					objectFit="contain"
					style={{ flex: 1 }}
				/>
			)}

			<View
				style={{
					position: "absolute",
					top: insets.top + 8,
					left: 12,
					right: 12,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<XStack
					alignItems="center"
					gap={6}
					paddingVertical={4}
					paddingHorizontal={8}
					borderRadius={8}
					backgroundColor="rgba(0,0,0,0.5)"
				>
					<TvMinimalPlayIcon
						size={14}
						color={theme.textColor?.val}
					/>
					<AppText
						fontSize={13}
						numberOfLines={1}
					>
						{payload.label}
					</AppText>
				</XStack>

				<YStack
					width={32}
					height={32}
					alignItems="center"
					justifyContent="center"
					borderRadius={16}
					backgroundColor="rgba(0,0,0,0.5)"
					onPress={payload.onClose}
				>
					<Minimize2Icon
						size={16}
						color={theme.textColor?.val}
					/>
				</YStack>
			</View>

			{payload.hasAudio && payload.onVolume && (
				<View
					style={{
						position: "absolute",
						left: 16,
						right: 16,
						bottom: insets.bottom + 16,
						paddingHorizontal: 12,
						paddingVertical: 4,
						borderRadius: 10,
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				>
					<Slider
						size="sm"
						min={0}
						max={100}
						step={1}
						defaultValue={payload.volume}
						onValueCommit={payload.onVolume}
						haptics
					/>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "black",
		zIndex: 10,
	},
})

export default ScreenFullscreen
