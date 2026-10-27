import type {
	AudioInputProcessingConfig,
	AudioOutputProcessingConfig,
	AudioProcessingCapabilities,
	AudioProcessingConfig,
	InputGainMode,
	NoiseSuppressionMode,
} from "./types"

import { logger } from "@/rtc/audio"
import adapter from "@/adapter"
import BaseStore from "@/classes/BaseStore"

import {
	AUDIO_SETTINGS_KEYS,
	readAudioSetting,
	writeAudioSetting,
} from "../settings"

import {
	DEFAULT_AUDIO_PROCESSING_CONFIG,
	clampGain,
	clampGateThreshold,
} from "./types"

interface AudioProcessingState {
	available: boolean
	capabilities: AudioProcessingCapabilities | null
	input: AudioInputProcessingConfig
	output: AudioOutputProcessingConfig
}

export class AudioProcessingManager extends BaseStore<AudioProcessingState> {
	available!: AudioProcessingState["available"]
	capabilities!: AudioProcessingState["capabilities"]
	input!: AudioProcessingState["input"]
	output!: AudioProcessingState["output"]

	config: AudioProcessingConfig

	private loaded = false

	constructor() {
		super({
			available: false,
			capabilities: null,
			input: { ...DEFAULT_AUDIO_PROCESSING_CONFIG.input },
			output: { ...DEFAULT_AUDIO_PROCESSING_CONFIG.output },
		})

		this.config = {
			input: { ...DEFAULT_AUDIO_PROCESSING_CONFIG.input },
			output: { ...DEFAULT_AUDIO_PROCESSING_CONFIG.output },
		}
	}

	get supported(): boolean {
		return !!adapter.audioProcessing
	}

	sync(): void {
		this.setState({
			available: !!adapter.audioProcessing,
			capabilities: adapter.audioProcessing?.capabilities ?? null,
		})

		// restore the persisted preferences once, the first time the adapter is
		// registered by the host
		if (!this.loaded) {
			this.loaded = true
			void this.load()
		}
	}

	private async load(): Promise<void> {
		const defaults = DEFAULT_AUDIO_PROCESSING_CONFIG
		const noiseSuppression = readAudioSetting(
			AUDIO_SETTINGS_KEYS.noiseSuppression,
			defaults.input.noiseSuppression,
		)
		const gainMode = readAudioSetting(
			AUDIO_SETTINGS_KEYS.gainMode,
			defaults.input.gainMode,
		)

		const input: AudioInputProcessingConfig = {
			noiseSuppression:
				noiseSuppression === "off" ||
				noiseSuppression === "system" ||
				noiseSuppression === "rnnoise"
					? noiseSuppression
					: defaults.input.noiseSuppression,
			echoCancellation: !!readAudioSetting(
				AUDIO_SETTINGS_KEYS.echoCancellation,
				defaults.input.echoCancellation,
			),
			gainMode: gainMode === "auto" ? "auto" : "manual",
			gateEnabled: !!readAudioSetting(
				AUDIO_SETTINGS_KEYS.gateEnabled,
				defaults.input.gateEnabled,
			),
			gateThresholdDb: clampGateThreshold(
				Number(
					readAudioSetting(
						AUDIO_SETTINGS_KEYS.gateThresholdDb,
						defaults.input.gateThresholdDb,
					),
				),
			),
			gainDb: clampGain(
				Number(
					readAudioSetting(
						AUDIO_SETTINGS_KEYS.inputGainDb,
						defaults.input.gainDb,
					),
				),
			),
		}

		const output: AudioOutputProcessingConfig = {
			gainDb: clampGain(
				Number(
					readAudioSetting(
						AUDIO_SETTINGS_KEYS.outputGainDb,
						defaults.output.gainDb,
					),
				),
			),
		}

		this.config = { input, output }

		this.setState({
			input: { ...input },
			output: { ...output },
		})

		try {
			await adapter.audioProcessing?.apply(this.config)
		} catch (error) {
			logger.error("failed to load processing config", error)
		}
	}

	private persist(): void {
		const { input, output } = this.config

		writeAudioSetting(
			AUDIO_SETTINGS_KEYS.noiseSuppression,
			input.noiseSuppression,
		)
		writeAudioSetting(
			AUDIO_SETTINGS_KEYS.echoCancellation,
			input.echoCancellation,
		)
		writeAudioSetting(AUDIO_SETTINGS_KEYS.gainMode, input.gainMode)
		writeAudioSetting(AUDIO_SETTINGS_KEYS.gateEnabled, input.gateEnabled)
		writeAudioSetting(
			AUDIO_SETTINGS_KEYS.gateThresholdDb,
			input.gateThresholdDb,
		)
		writeAudioSetting(AUDIO_SETTINGS_KEYS.inputGainDb, input.gainDb)
		writeAudioSetting(AUDIO_SETTINGS_KEYS.outputGainDb, output.gainDb)
	}

	private async commit(
		input: Partial<AudioInputProcessingConfig>,
		output: Partial<AudioOutputProcessingConfig>,
	): Promise<void> {
		this.config = {
			input: { ...this.config.input, ...input },
			output: { ...this.config.output, ...output },
		}

		this.config.input.gainDb = clampGain(this.config.input.gainDb)
		this.config.input.gateThresholdDb = clampGateThreshold(
			this.config.input.gateThresholdDb,
		)
		this.config.output.gainDb = clampGain(this.config.output.gainDb)

		this.setState({
			input: { ...this.config.input },
			output: { ...this.config.output },
		})

		this.persist()

		try {
			await adapter.audioProcessing?.apply(this.config)
		} catch (error) {
			logger.error("failed to apply processing config", error)
		}
	}

	async apply(): Promise<void> {
		return this.commit({}, {})
	}

	async update(
		input: Partial<AudioInputProcessingConfig> = {},
		output: Partial<AudioOutputProcessingConfig> = {},
	): Promise<void> {
		return this.commit(input, output)
	}

	async setNoiseSuppression(mode: NoiseSuppressionMode): Promise<void> {
		return this.commit({ noiseSuppression: mode }, {})
	}

	async setGateEnabled(enabled: boolean): Promise<void> {
		return this.commit({ gateEnabled: enabled }, {})
	}

	async setGateThresholdDb(db: number): Promise<void> {
		return this.commit({ gateThresholdDb: db }, {})
	}

	async setGainMode(mode: InputGainMode): Promise<void> {
		return this.commit({ gainMode: mode }, {})
	}

	async setInputGainDb(db: number): Promise<void> {
		return this.commit({ gainDb: db }, {})
	}

	async setEchoCancellation(enabled: boolean): Promise<void> {
		return this.commit({ echoCancellation: enabled }, {})
	}

	async setOutputGainDb(db: number): Promise<void> {
		return this.commit({}, { gainDb: db })
	}
}

export const audioProcessing = new AudioProcessingManager()

export function useAudioProcessing(): AudioProcessingState
export function useAudioProcessing<U>(
	selector: (state: AudioProcessingState) => U,
): U
export function useAudioProcessing<U>(
	selector?: (state: AudioProcessingState) => U,
) {
	return audioProcessing.useStore(selector!)
}

export * from "./types"
export default audioProcessing
