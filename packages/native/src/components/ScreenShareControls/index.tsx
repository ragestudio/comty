import { YStack } from "tamagui"
import { GaugeIcon, ProportionsIcon } from "lucide-react-native"
import { Select } from "panelui-native"

import { rtcService } from "@comty/spaces-sdk/rtc"

import { OptionRow } from "../OptionRow"
import {
	SCREEN_SHARE_FRAMERATES,
	getScreenShareSize,
	useScreenShareControls,
	type ScreenShareQuality,
} from "./store"

const selectTriggerClass = "py-2 px-3 rounded-md"
const selectTextClass = "text-sm"

const qualityOptions: { value: ScreenShareQuality; label: string }[] = [
	{ value: "480p", label: "480p" },
	{ value: "720p", label: "720p" },
	{ value: "1080p", label: "1080p" },
	{ value: "source", label: "Source" },
]

const framerateOptions = SCREEN_SHARE_FRAMERATES.map((framerate) => ({
	value: String(framerate),
	label: `${framerate} fps`,
}))

const ScreenShareControls = () => {
	const controls = useScreenShareControls()

	const handleQuality = (quality: ScreenShareQuality) => {
		controls.setQuality(quality)

		const size = getScreenShareSize(quality)

		// resize the capture in place and keep the bitrate in sync with it
		rtcService.self
			.updateScreenConstraints({ width: size.width, height: size.height })
			.then(() =>
				rtcService.self.updateScreenEncoding({
					framerate: controls.framerate,
				}),
			)
			.catch(console.error)
	}

	const handleFramerate = (framerate: number) => {
		controls.setFramerate(framerate)

		rtcService.self.updateScreenEncoding({ framerate }).catch(console.error)
	}

	return (
		<YStack gap={6}>
			<OptionRow
				label="Quality"
				icon={<ProportionsIcon />}
				vertical
			>
				<Select
					value={controls.quality}
					onValueChange={(value) => handleQuality(value as ScreenShareQuality)}
					triggerClassName={selectTriggerClass}
					valueClassName={selectTextClass}
					placeholderClassName={selectTextClass}
				>
					{qualityOptions.map((option) => (
						<Select.Item
							key={option.value}
							value={option.value}
							label={option.label}
						/>
					))}
				</Select>
			</OptionRow>

			<OptionRow
				label="Frame rate"
				icon={<GaugeIcon />}
				vertical
			>
				<Select
					value={String(controls.framerate)}
					onValueChange={(value) => handleFramerate(Number(value))}
					triggerClassName={selectTriggerClass}
					valueClassName={selectTextClass}
					placeholderClassName={selectTextClass}
				>
					{framerateOptions.map((option) => (
						<Select.Item
							key={option.value}
							value={option.value}
							label={option.label}
						/>
					))}
				</Select>
			</OptionRow>
		</YStack>
	)
}

export default ScreenShareControls
