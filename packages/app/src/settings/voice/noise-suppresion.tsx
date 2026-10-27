import type { NoiseSuppressionMode } from "@comty/spaces-sdk/rtc/audio/processing"

import { audioProcessing } from "@comty/spaces-sdk/rtc/audio/processing"

const options = [
	{
		value: "off",
		label: "Disabled",
	},
	{
		value: "system",
		label: "Standard",
	},
	{
		value: "rnnoise",
		label: "RNNoise",
	},
]

export default {
	id: "voice:noiseSuppression",
	group: "audio",
	title: "Noise Suppression",
	description: "Reduce the background noise captured by the microphone.",
	component: "Select",
	defaultValue: () => audioProcessing.getState().input.noiseSuppression,
	props: () => {
		const supported = audioProcessing.getState().capabilities?.noiseSuppression

		return {
			options: supported
				? options.filter((option) =>
						supported.includes(option.value as NoiseSuppressionMode),
					)
				: options,
		}
	},
	onUpdate: async (value) => {
		await audioProcessing.setNoiseSuppression(value)

		return value
	},
}
