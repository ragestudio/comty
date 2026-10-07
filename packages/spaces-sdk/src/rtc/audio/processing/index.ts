import type {
	AudioInputProcessingConfig,
	AudioOutputProcessingConfig,
	AudioProcessingCapabilities,
	AudioProcessingConfig,
	InputGainMode,
	NoiseSuppressionMode,
} from "./types"

import adapter from "@/adapter"
import BaseStore from "@/classes/BaseStore"

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

		try {
			await adapter.audioProcessing?.apply(this.config)
		} catch (error) {
			console.error("[audio] failed to apply processing config", error)
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
