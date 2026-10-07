export type NoiseSuppressionMode = "off" | "system" | "rnnoise"

export type InputGainMode = "manual" | "auto"

export interface AudioInputProcessingConfig {
	noiseSuppression: NoiseSuppressionMode
	gateEnabled: boolean
	gateThresholdDb: number
	gainMode: InputGainMode
	gainDb: number
	echoCancellation: boolean
}

export interface AudioOutputProcessingConfig {
	gainDb: number
}

export interface AudioProcessingConfig {
	input: AudioInputProcessingConfig
	output: AudioOutputProcessingConfig
}

export interface AudioProcessingCapabilities {
	noiseSuppression: NoiseSuppressionMode[]
	gate: boolean
	manualGain: boolean
	autoGain: boolean
	echoCancellation: boolean
	outputGain: boolean
}

export interface AudioProcessingAdapter {
	capabilities: AudioProcessingCapabilities
	apply(config: AudioProcessingConfig): Promise<void>
}

export const GAIN_MIN_DB = -10
export const GAIN_MAX_DB = 20
export const GATE_THRESHOLD_MIN_DB = -80
export const GATE_THRESHOLD_MAX_DB = 0

export const DEFAULT_AUDIO_PROCESSING_CONFIG: AudioProcessingConfig = {
	input: {
		noiseSuppression: "system",
		gateEnabled: false,
		gateThresholdDb: -50,
		gainMode: "manual",
		gainDb: 0,
		echoCancellation: false,
	},
	output: {
		gainDb: 0,
	},
}

export function clampGain(db: number) {
	if (!Number.isFinite(db)) return 0

	return Math.min(GAIN_MAX_DB, Math.max(GAIN_MIN_DB, db))
}

export function clampGateThreshold(db: number) {
	if (!Number.isFinite(db)) return GATE_THRESHOLD_MIN_DB

	return Math.min(GATE_THRESHOLD_MAX_DB, Math.max(GATE_THRESHOLD_MIN_DB, db))
}
