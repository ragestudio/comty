import type { AudioDevice, AudioStrategy } from "./types"

import BaseStore from "@/classes/BaseStore"

import nativeStrategy from "./strategies/native"
import webStrategy from "./strategies/web"

interface AudioReactiveState {
	devices: AudioDevice[]
	outputDeviceId: string | null
	inputDeviceId: string | null
	speakerEnabled: boolean
	speakerAvailable: boolean
}

// ordered by priority, the first supported strategy wins
const strategies: AudioStrategy[] = [nativeStrategy, webStrategy]

export class AudioManager extends BaseStore<AudioReactiveState> {
	devices!: AudioReactiveState["devices"]
	outputDeviceId!: AudioReactiveState["outputDeviceId"]
	inputDeviceId!: AudioReactiveState["inputDeviceId"]
	speakerEnabled!: AudioReactiveState["speakerEnabled"]
	speakerAvailable!: AudioReactiveState["speakerAvailable"]

	constructor() {
		super({
			devices: [],
			outputDeviceId: null,
			inputDeviceId: null,
			speakerEnabled: false,
			speakerAvailable: false,
		})
	}

	get strategy(): AudioStrategy | null {
		return strategies.find((strategy) => strategy.supports()) ?? null
	}

	get outputs(): AudioDevice[] {
		return this.devices.filter((device) => device.kind === "output")
	}

	get inputs(): AudioDevice[] {
		return this.devices.filter((device) => device.kind === "input")
	}

	async refresh(): Promise<AudioDevice[]> {
		const strategy = this.strategy

		if (!strategy) {
			return []
		}

		try {
			const devices = await strategy.getDevices()
			const currentOutput = devices.find(
				(device) => device.kind === "output" && device.isCurrent,
			)

			this.setState({
				devices,
				speakerAvailable: strategy.speakerAvailable,
				outputDeviceId: currentOutput?.id ?? this.outputDeviceId,
			})

			return devices
		} catch (error) {
			console.error("[audio] failed to refresh devices", error)
			return []
		}
	}

	async setSpeakerEnabled(enabled: boolean): Promise<void> {
		const strategy = this.strategy

		if (!strategy?.setSpeakerEnabled) {
			return
		}

		try {
			await strategy.setSpeakerEnabled(enabled)
			this.setState({ speakerEnabled: enabled })
		} catch (error) {
			console.error("[audio] failed to set speaker", error)
		}
	}

	async toggleSpeaker(): Promise<void> {
		return this.setSpeakerEnabled(!this.speakerEnabled)
	}

	async setOutputDevice(deviceId: string): Promise<boolean> {
		const strategy = this.strategy

		if (!strategy?.setOutputDevice) {
			return false
		}

		try {
			const applied = await strategy.setOutputDevice(deviceId)

			if (applied) {
				this.setState({ outputDeviceId: deviceId })
			}

			return applied
		} catch (error) {
			console.error("[audio] failed to set output device", error)
			return false
		}
	}
}

export const audioManager = new AudioManager()

export function useAudioStore(): AudioReactiveState
export function useAudioStore<U>(selector: (state: AudioReactiveState) => U): U
export function useAudioStore<U>(selector?: (state: AudioReactiveState) => U) {
	return audioManager.useStore(selector!)
}

export type { AudioDevice, AudioDeviceKind, AudioStrategy } from "./types"

export * from "./processing"

export default useAudioStore
