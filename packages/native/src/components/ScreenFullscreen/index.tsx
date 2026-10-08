import React from "react"
import { Pressable, StatusBar, StyleSheet, View } from "react-native"
import { RTCView } from "react-native-webrtc"
import * as ScreenOrientation from "expo-screen-orientation"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme, XStack, YStack } from "tamagui"
import { Minimize2Icon, TvMinimalPlayIcon } from "lucide-react-native"
import { Slider } from "panelui-native"
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

import AppText from "@/ui/Text"

import { useScreenFullscreen } from "./store"
import { CONTROLS_HIDE_DELAY } from "./constants"

export const ScreenFullscreen = () => {
	const payload = useScreenFullscreen().payload
	const theme = useTheme()
	const insets = useSafeAreaInsets()

	const [controlsVisible, setControlsVisible] = React.useState(true)
	const opacity = useSharedValue(1)
	const hideTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	const active = payload !== null

	const scheduleHide = React.useCallback(() => {
		if (hideTimeout.current) clearTimeout(hideTimeout.current)

		hideTimeout.current = setTimeout(
			() => setControlsVisible(false),
			CONTROLS_HIDE_DELAY,
		)
	}, [])

	const reveal = React.useCallback(() => {
		setControlsVisible(true)
		scheduleHide()
	}, [scheduleHide])

	// rotation is enabled and the status bar hidden only while fullscreen is up
	React.useEffect(() => {
		const lock = active
			? ScreenOrientation.OrientationLock.ALL
			: ScreenOrientation.OrientationLock.PORTRAIT_UP

		ScreenOrientation.lockAsync(lock).catch(console.error)
		StatusBar.setHidden(active, "fade")
	}, [active])

	// restore portrait and the status bar when the app tears down this view
	React.useEffect(() => {
		return () => {
			ScreenOrientation.lockAsync(
				ScreenOrientation.OrientationLock.PORTRAIT_UP,
			).catch(console.error)
			StatusBar.setHidden(false, "fade")
		}
	}, [])

	// every time a stream opens the controls start visible and fade after a short timeout
	React.useEffect(() => {
		if (!active) return

		setControlsVisible(true)
		scheduleHide()

		return () => {
			if (hideTimeout.current) clearTimeout(hideTimeout.current)
		}
	}, [active, scheduleHide])

	React.useEffect(() => {
		opacity.value = withTiming(controlsVisible ? 1 : 0, { duration: 180 })
	}, [controlsVisible])

	const controlsStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

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

			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={reveal}
			/>

			<Animated.View
				style={[StyleSheet.absoluteFill, controlsStyle]}
				pointerEvents={controlsVisible ? "box-none" : "none"}
			>
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
							paddingHorizontal: 10,
							paddingVertical: 2,
							borderRadius: 10,
							backgroundColor: "rgba(0,0,0,0.5)",
							width: "40%",
						}}
					>
						<Slider
							size="sm"
							trackClassName="h-2"
							thumbClassName="h-2"
							min={0}
							max={100}
							step={1}
							defaultValue={payload.volume}
							onValueChange={reveal}
							onValueCommit={payload.onVolume}
							haptics
						/>
					</View>
				)}
			</Animated.View>
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
