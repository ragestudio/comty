import type { AudioProcessing } from "@comty/spaces-sdk"

import {
	setAudioProcessingConfig,
	setHardwareNoiseSuppressor,
	setSystemAudioProcessingConfig,
} from "@ragestudio/react-native-webrtc"

const nativeAudioProcessing: AudioProcessing = {
	capabilities: {
		noiseSuppression: ["off", "system", "rnnoise"],
		gate: true,
		manualGain: true,
		autoGain: true,
		echoCancellation: true,
		outputGain: true,
	},
	async apply(config) {
		const { input, output } = config

		const useRnnoise = input.noiseSuppression === "rnnoise"
		const useSystemNs = input.noiseSuppression === "system"
		const manualGainDb = input.gainMode === "manual" ? input.gainDb : 0

		const chainEnabled =
			useRnnoise ||
			input.gateEnabled ||
			manualGainDb !== 0 ||
			output.gainDb !== 0

		await setAudioProcessingConfig({
			enabled: chainEnabled,
			rnnoiseEnabled: useRnnoise,
			gateEnabled: input.gateEnabled,
			gateThresholdDb: input.gateThresholdDb,
			inputGainDb: manualGainDb,
			outputGainDb: output.gainDb,
		})

		let hardwareNsApplied = false

		if (useSystemNs) {
			hardwareNsApplied = await setHardwareNoiseSuppressor(true)
		} else {
			await setHardwareNoiseSuppressor(false)
		}

		await setSystemAudioProcessingConfig({
			noiseSuppression: useSystemNs && !hardwareNsApplied,
			autoGainControl: input.gainMode === "auto",
			echoCancellation: input.echoCancellation,
			highPassFilter: false,
		})
	},
}

export default nativeAudioProcessing
