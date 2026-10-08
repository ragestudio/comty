import { useWindowDimensions, View } from "react-native"
import { RTCView } from "@ragestudio/react-native-webrtc"
import { XStack, YStack } from "tamagui"
import { MonitorOffIcon, TvMinimalPlayIcon } from "lucide-react-native"
import { Slider } from "panelui-native"

import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"

import AppButton from "@/ui/Button"
import AppText from "@/ui/Text"

const ScreenViewer = () => {
	const { width } = useWindowDimensions()

	const screens = useRTCStore((state) => state.statedScreens)
	const localStreamURL = useRTCStore((state) => state.localScreenStreamURL)

	if ((screens?.length ?? 0) === 0 && !localStreamURL) {
		return null
	}

	const tileWidth = width - 20

	const tileStyle = {
		width: tileWidth,
		height: tileWidth * (9 / 16),
		borderRadius: 12,
		overflow: "hidden" as const,
		backgroundColor: "black",
	}

	return (
		<YStack gap={12}>
			{localStreamURL && (
				<View
					key={localStreamURL}
					style={tileStyle}
				>
					<RTCView
						streamURL={localStreamURL}
						objectFit="contain"
						style={{ flex: 1 }}
					/>
				</View>
			)}

			{screens.map((screen) => (
				<YStack
					key={screen.userId}
					width={tileWidth}
					gap={6}
				>
					{screen.enabled ? (
						<>
							<View style={tileStyle}>
								{screen.streamURL && (
									<RTCView
										streamURL={screen.streamURL}
										objectFit="contain"
										style={{ flex: 1 }}
									/>
								)}
							</View>

							{screen.hasAudio && (
								<Slider
									min={0}
									max={100}
									step={1}
									defaultValue={screen.volume}
									onValueCommit={(value) =>
										rtcService.screens.setVolume(screen.userId, value)
									}
									label="Screen volume"
									showValue
									formatValue={(value) => `${Math.round(value)}%`}
									haptics
								/>
							)}

							<AppButton
								children={
									<XStack
										alignItems="center"
										gap={6}
									>
										<MonitorOffIcon size={16} />
										<AppText fontSize={13}>Stop watching</AppText>
									</XStack>
								}
								onPress={() => rtcService.screens.disable(screen.userId)}
							/>
						</>
					) : (
						<XStack
							alignItems="center"
							justifyContent="space-between"
							gap={10}
							padding={10}
							borderRadius={12}
							borderWidth={1}
							borderColor="$borderColor"
						>
							<XStack
								alignItems="center"
								gap={8}
							>
								<TvMinimalPlayIcon size={18} />
								<AppText fontSize={13}>Screen share available</AppText>
							</XStack>

							<AppButton
								type="primary"
								children={<AppText fontSize={13}>Watch</AppText>}
								onPress={() => rtcService.screens.enable(screen.userId)}
							/>
						</XStack>
					)}
				</YStack>
			))}
		</YStack>
	)
}

export default ScreenViewer
