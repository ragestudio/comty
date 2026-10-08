import type { LayoutChangeEvent } from "react-native"

import React from "react"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated"
import { useTheme, XStack, YStack } from "tamagui"

import TextureBg from "@/ui/TextureBg"
import AppButton from "@/ui/Button"
import InputAudioControls from "@/components/InputAudioControls"
import SectionTitle from "./SectionTitle"

import {
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	Volume2Icon,
	VolumeOffIcon,
	TvMinimalPlayIcon,
	MonitorOffIcon,
} from "lucide-react-native"

import { useRTCStore, rtcService } from "@comty/spaces-sdk/rtc"
import { audioManager } from "@comty/spaces-sdk/rtc/audio"
import { useRTCControls } from "./store"

import { CONTAINER_ANIM_SPRING, DRAG_THRESHOLD } from "./constants"

export const RTCControls = () => {
	const rtc = useRTCStore()
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const controls = useRTCControls()

	const expanded = controls.expanded
	const progress = useSharedValue(expanded ? 1 : 0)
	const opened = useSharedValue(expanded ? 1 : 0)
	const contentHeight = useSharedValue(0)

	React.useEffect(() => {
		const target = expanded ? 1 : 0

		opened.value = target
		progress.value = withSpring(target, CONTAINER_ANIM_SPRING)

		if (expanded) {
			audioManager.refresh().catch(console.error)
		}
	}, [expanded])

	const contentStyle = useAnimatedStyle(() => ({
		height: Math.max(contentHeight.value * progress.value, 0),
		opacity: Math.max(progress.value, 0),
	}))

	// the tab bar collapses while expanded, so the panel has to take over its
	// bottom safe area padding
	const containerStyle = useAnimatedStyle(() => ({
		paddingBottom: insets.bottom * progress.value,
	}))

	const onContentLayout = (event: LayoutChangeEvent) => {
		contentHeight.value = event.nativeEvent.layout.height
	}

	// a small drag past the threshold opens or closes the panel, animating with a
	// spring so the reveal is smooth instead of following the finger
	const panGesture = Gesture.Pan().onUpdate((event) => {
		const drag = event.translationY

		// the store drives the animation so the panel and the tab bar start their
		// spring in the same commit instead of drifting apart
		if (opened.value === 0 && drag < -DRAG_THRESHOLD) {
			opened.value = 1
			runOnJS(controls.setExpanded)(true)
		} else if (opened.value === 1 && drag > DRAG_THRESHOLD) {
			opened.value = 0
			runOnJS(controls.setExpanded)(false)
		}
	})

	const handleLeaveChannel = () => {
		rtcService.handlers.leaveChannel()
	}

	const handleToggleMute = () => {
		rtcService.self.toggleMute()
	}

	const handleToggleDeafened = () => {
		rtcService.self.toggleDeafened()
	}

	const handleToggleScreenshare = () => {
		if (rtc.screenVideoProducerId) {
			rtcService.self.destroyMedia("screen")
		} else {
			rtcService.self.createMedia<"screen">("screen")
		}
	}

	return (
		<Animated.View style={containerStyle}>
			<YStack
				width="100%"
				paddingHorizontal={10}
			>
				<YStack
					width="100%"
					borderRadius={16}
					overflow="hidden"
				>
					<TextureBg
						borderRadius={16}
						borderWidth={1}
						blurBackground
					/>

					<GestureDetector gesture={panGesture}>
						<Animated.View>
							<XStack
								alignItems="center"
								justifyContent="center"
								paddingHorizontal={16}
								paddingVertical={8}
							>
								<YStack
									width={36}
									height={4}
									borderRadius={2}
									backgroundColor="$borderColorSolid"
									opacity={0.5}
								/>
							</XStack>
						</Animated.View>
					</GestureDetector>

					<XStack
						width="100%"
						alignItems="center"
						justifyContent="space-evenly"
						paddingHorizontal={10}
						paddingBottom={expanded ? 4 : 10}
						paddingTop={4}
					>
						<AppButton
							width="fit-content"
							children={
								rtc.voiceState.muted ? (
									<MicOffIcon color={theme.productColor.val} />
								) : (
									<MicIcon
										color={
											rtc.isSpeaking ? theme.productColor.val : theme.color?.val
										}
									/>
								)
							}
							onPress={handleToggleMute}
							borderRadius={12}
							outlineWidth={rtc.isSpeaking ? 2 : 0}
							outlineColor={rtc.isSpeaking ? "$productColor" : "$borderColor"}
						/>
						<AppButton
							width="fit-content"
							children={
								rtc.voiceState.deafened ? (
									<VolumeOffIcon color={theme.productColor.val} />
								) : (
									<Volume2Icon color={theme.color?.val} />
								)
							}
							onPress={handleToggleDeafened}
						/>
						<AppButton
							width="fit-content"
							children={
								rtc.screenVideoProducerId ? (
									<MonitorOffIcon color={theme.productColor.val} />
								) : (
									<TvMinimalPlayIcon />
								)
							}
							onPress={handleToggleScreenshare}
						/>
						<AppButton
							width="fit-content"
							children={<PhoneOffIcon color={theme.colorError?.val} />}
							onPress={handleLeaveChannel}
						/>
					</XStack>

					<Animated.View style={[{ overflow: "hidden" }, contentStyle]}>
						<YStack
							position="absolute"
							top={0}
							left={0}
							right={0}
							onLayout={onContentLayout}
							paddingHorizontal={16}
							paddingVertical={16}
							gap={20}
						>
							<YStack gap={6}>
								<SectionTitle>Audio</SectionTitle>
								<InputAudioControls />
							</YStack>
						</YStack>
					</Animated.View>
				</YStack>
			</YStack>
		</Animated.View>
	)
}

export default RTCControls
