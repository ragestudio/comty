import { YStack } from "tamagui"

import { OptionRow } from "../OptionRow"
import { EarIcon, MicAudioLinesIcon, Volume2Icon } from "lucide-react-native"
import { Select, Slider, SparklesIcon, Switch } from "panelui-native"

import {
	audioManager,
	useAudioStore,
	audioProcessing,
	useAudioProcessing,
	type NoiseSuppressionMode,
} from "@comty/spaces-sdk/rtc/audio"

const NSModes: { value: NoiseSuppressionMode; label: string }[] = [
	{ value: "off", label: "Off" },
	{ value: "system", label: "System" },
	{ value: "rnnoise", label: "RNNoise" },
]

const InputAudioControls = () => {
	const audioState = useAudioStore()
	const audioProcessingState = useAudioProcessing()

	const handleToggleSpeaker = (to: boolean) => {
		audioManager.toggleSpeaker()
	}

	return (
		<YStack gap={6}>
			{audioState.speakerAvailable && (
				<OptionRow
					label="Earpiece"
					icon={<EarIcon />}
				>
					<Switch
						onValueChange={handleToggleSpeaker}
						value={!audioState.speakerEnabled}
					/>
				</OptionRow>
			)}

			<OptionRow
				label="Noise supression"
				icon={<SparklesIcon />}
				vertical
			>
				<Select
					value={audioProcessingState.input.noiseSuppression}
					onValueChange={(value) =>
						audioProcessing.setNoiseSuppression(value as NoiseSuppressionMode)
					}
				>
					{NSModes.map((mode) => (
						<Select.Item
							key={mode.value}
							value={mode.value}
							label={mode.label}
						/>
					))}
				</Select>
			</OptionRow>

			<OptionRow
				label="Echo cancellation"
				icon={<MicAudioLinesIcon />}
			>
				<Switch
					onValueChange={(to) => audioProcessing.setEchoCancellation(to)}
					value={audioProcessingState.input.echoCancellation}
				/>
			</OptionRow>

			<YStack>
				<OptionRow
					label={
						audioProcessingState.input.gainMode === "auto"
							? "Auto Gain"
							: "Manual Gain"
					}
					icon={<Volume2Icon />}
				>
					<Switch
						onValueChange={(to) =>
							audioProcessing.setGainMode(to ? "auto" : "manual")
						}
						value={audioProcessingState.input.gainMode === "auto"}
					/>
				</OptionRow>

				{audioProcessingState.input.gainMode === "manual" && (
					<Slider
						min={-10}
						max={20}
						step={1}
						defaultValue={audioProcessingState.input.gainDb}
						onValueCommit={(value) => audioProcessing.setInputGainDb(value)}
						haptics
					/>
				)}
			</YStack>

			<OptionRow
				label="Output Gain"
				icon={<Volume2Icon />}
				vertical
			>
				<Slider
					min={-10}
					max={20}
					step={1}
					defaultValue={audioProcessingState.input.gainDb}
					onValueCommit={(value) => audioProcessing.setInputGainDb(value)}
					haptics
				/>
			</OptionRow>
		</YStack>
	)
}

export default InputAudioControls
