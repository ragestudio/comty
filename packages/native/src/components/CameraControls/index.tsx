import { YStack } from "tamagui"
import { GaugeIcon, SwitchCameraIcon } from "lucide-react-native"
import { Select } from "panelui-native"

import { rtcService } from "@comty/spaces-sdk/rtc"

import { OptionRow } from "../OptionRow"
import {
	CAMERA_RESOLUTIONS,
	useCameraControls,
	type CameraFacing,
	type CameraQuality,
} from "./store"

const selectTriggerClass = "py-2 px-3 rounded-md"
const selectTextClass = "text-sm"

const facingOptions: { value: CameraFacing; label: string }[] = [
	{ value: "user", label: "Front" },
	{ value: "environment", label: "Back" },
]

const qualityOptions: { value: CameraQuality; label: string }[] = [
	{ value: "360p", label: "360p" },
	{ value: "540p", label: "540p" },
	{ value: "720p", label: "720p" },
	{ value: "1080p", label: "1080p" },
]

const applyToActiveCamera = async (constraints: MediaTrackConstraints) => {
	const { cameraProducerId } = rtcService.getState()

	if (!cameraProducerId) return

	try {
		const track = rtcService.producers.get(cameraProducerId)?.track

		await track?.applyConstraints(constraints)
	} catch (error) {
		console.error("[camera] failed to apply constraints", error)
	}
}

const CameraControls = () => {
	const controls = useCameraControls()

	const handleFacing = (value: CameraFacing) => {
		controls.setFacing(value)
		applyToActiveCamera({ facingMode: value }).catch(console.error)
	}

	const handleQuality = (value: CameraQuality) => {
		controls.setQuality(value)

		const resolution = CAMERA_RESOLUTIONS[value]

		applyToActiveCamera({
			width: { ideal: resolution.width },
			height: { ideal: resolution.height },
		}).catch(console.error)
	}

	return (
		<YStack gap={6}>
			<OptionRow
				label="Camera"
				icon={<SwitchCameraIcon />}
				vertical
			>
				<Select
					value={controls.facing}
					onValueChange={(value) => handleFacing(value as CameraFacing)}
					triggerClassName={selectTriggerClass}
					valueClassName={selectTextClass}
					placeholderClassName={selectTextClass}
				>
					{facingOptions.map((option) => (
						<Select.Item
							key={option.value}
							value={option.value}
							label={option.label}
						/>
					))}
				</Select>
			</OptionRow>

			<OptionRow
				label="Quality"
				icon={<GaugeIcon />}
				vertical
			>
				<Select
					value={controls.quality}
					onValueChange={(value) => handleQuality(value as CameraQuality)}
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
		</YStack>
	)
}

export default CameraControls
