import type { AudioDevice, AudioRouteMode, AudioStrategy } from "./types"

import adapter from "@/adapter"
import BaseStore from "@/classes/BaseStore"

import nativeStrategy from "./strategies/native"
import webStrategy from "./strategies/web"

interface AudioReactiveState {
	devices: AudioDevice[]
	outputDeviceId: string | null
	inputDeviceId: string | null
	speakerEnabled: boolean
	speakerAvailable: boolean
	routeMode: AudioRouteMode
	routeModeSupported: boolean
}

const BLUETOOTH_TYPES = ["bluetooth-sco", "bluetooth-a2dp", "bluetooth-le"]

export function isBluetoothDevice(
	device: AudioDevice | null | undefined,
): boolean {
	return !!device && BLUETOOTH_TYPES.includes(device.type)
}

// routes may change the device id while keeping the same physical headset (sco
// vs a2dp), a short window is ignored after we change routing ourselves to avoid
// reacting to the changes we caused
const ROUTING_SETTLE_MS = 1500
const DEVICES_DEBOUNCE_MS = 400

// ordered by priority, the first supported strategy wins
const strategies: AudioStrategy[] = [nativeStrategy, webStrategy]

export class AudioManager extends BaseStore<AudioReactiveState> {
	devices!: AudioReactiveState["devices"]
	outputDeviceId!: AudioReactiveState["outputDeviceId"]
	inputDeviceId!: AudioReactiveState["inputDeviceId"]
	speakerEnabled!: AudioReactiveState["speakerEnabled"]
	speakerAvailable!: AudioReactiveState["speakerAvailable"]
	routeMode!: AudioReactiveState["routeMode"]
	routeModeSupported!: AudioReactiveState["routeModeSupported"]

	private unsubscribeDevices?: () => void
	private devicesTimer?: ReturnType<typeof setTimeout>
	private handlingDevices = false
	private busyUntil = 0
	private lastBluetoothAvailable?: boolean
	// routing is only held while a call is running
	private active = false

	constructor() {
		super({
			devices: [],
			outputDeviceId: null,
			inputDeviceId: null,
			speakerEnabled: false,
			speakerAvailable: false,
			routeMode: "call",
			routeModeSupported: false,
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

	get selectedOutput(): AudioDevice | null {
		return this.outputs.find((d) => d.id === this.outputDeviceId) ?? null
	}

	// the bluetooth mode switch only makes sense when a bluetooth output is used
	get selectedOutputIsBluetooth(): boolean {
		return isBluetoothDevice(this.selectedOutput)
	}

	get hasBluetoothHeadset(): boolean {
		return this.outputs.some((device) => isBluetoothDevice(device))
	}

	private get bluetoothOutput(): AudioDevice | null {
		return this.outputs.find(isBluetoothDevice) ?? null
	}

	private get bluetoothInput(): AudioDevice | null {
		return this.inputs.find(isBluetoothDevice) ?? null
	}

	private get builtinMic(): AudioDevice | null {
		return this.inputs.find((d) => d.type === "builtin-mic") ?? null
	}

	// starts listening for device hotplug, returns a stop function
	observe(): () => void {
		if (this.unsubscribeDevices) {
			return this.unsubscribeDevices
		}

		const unsubscribe =
			adapter.audioDevicesEvents?.subscribe(() => {
				if (this.devicesTimer) {
					clearTimeout(this.devicesTimer)
				}

				// coalesce the burst of events fired by a single routing change
				this.devicesTimer = setTimeout(() => {
					this.devicesTimer = undefined
					this.handleDevicesChanged().catch(console.error)
				}, DEVICES_DEBOUNCE_MS)
			}) ?? (() => {})

		this.unsubscribeDevices = () => {
			if (this.devicesTimer) {
				clearTimeout(this.devicesTimer)
			}

			this.devicesTimer = undefined
			unsubscribe()
		}

		return this.unsubscribeDevices
	}

	// called when a call starts or ends. while idle no route is held, when a call
	// ends the native side releases the headset from the voice profile
	async setActive(active: boolean): Promise<void> {
		if (this.active === active) {
			return
		}

		this.active = active

		const strategy = this.strategy

		if (!strategy) {
			return
		}

		if (!active) {
			await strategy.resetRouting?.()
			return
		}

		await this.refresh()
		await this.applyActiveRouting()
	}

	// brings the native routing in line with the current selection when a call
	// starts, preferring bluetooth when a headset is connected
	private async applyActiveRouting(): Promise<void> {
		const strategy = this.strategy

		if (!strategy) {
			return
		}

		const selected = this.selectedOutput
		const bluetooth = this.bluetoothOutput

		if (bluetooth && !isBluetoothDevice(selected)) {
			await this.setOutputDevice(bluetooth.id)
			return
		}

		if (isBluetoothDevice(selected)) {
			this.busyUntil = Date.now() + ROUTING_SETTLE_MS
			await strategy.setRouteMode?.(this.routeMode)
			await this.syncInput(true, this.routeMode)
			return
		}

		await strategy.setRouteMode?.("call")
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
			const currentInput = devices.find(
				(device) => device.kind === "input" && device.isCurrent,
			)

			let speakerEnabled = this.speakerEnabled

			if (strategy.isSpeakerEnabled) {
				speakerEnabled = await strategy.isSpeakerEnabled()
			}

			this.setState({
				devices,
				speakerAvailable: strategy.speakerAvailable,
				speakerEnabled,
				routeModeSupported: !!strategy.setRouteMode,
				outputDeviceId: this.resolveOutputId(devices, currentOutput),
				inputDeviceId: this.resolveInputId(devices, currentInput),
			})

			return devices
		} catch (error) {
			console.error("[audio] failed to refresh devices", error)
			return []
		}
	}

	// keeps an explicit selection while it exists, follows the same physical
	// bluetooth headset across route changes and falls back to the system device
	private resolveOutputId(
		devices: AudioDevice[],
		current: AudioDevice | undefined,
	): string | null {
		const keep = devices.some(
			(device) =>
				device.kind === "output" && device.id === this.outputDeviceId,
		)

		if (keep) {
			return this.outputDeviceId
		}

		const previous = this.outputs.find((d) => d.id === this.outputDeviceId)
		const nextBluetooth = devices.find(
			(device) => device.kind === "output" && isBluetoothDevice(device),
		)

		if (isBluetoothDevice(previous) && nextBluetooth) {
			return nextBluetooth.id
		}

		return current?.id ?? null
	}

	private resolveInputId(
		devices: AudioDevice[],
		current: AudioDevice | undefined,
	): string | null {
		const keep = devices.some(
			(device) =>
				device.kind === "input" && device.id === this.inputDeviceId,
		)

		if (keep) {
			return this.inputDeviceId
		}

		const previous = this.inputs.find((d) => d.id === this.inputDeviceId)
		const nextBluetooth = devices.find(
			(device) => device.kind === "input" && isBluetoothDevice(device),
		)

		if (isBluetoothDevice(previous) && nextBluetooth) {
			return nextBluetooth.id
		}

		return current?.id ?? null
	}

	private async checkBluetoothAvailable(): Promise<boolean> {
		const strategy = this.strategy

		if (strategy?.isBluetoothAvailable) {
			return strategy.isBluetoothAvailable()
		}

		return this.outputs.some(isBluetoothDevice)
	}

	// reacts to audio device hotplug. connecting a bluetooth headset makes it the
	// default output, unplugging it falls back to a builtin output
	async handleDevicesChanged(): Promise<void> {
		if (this.handlingDevices) {
			return
		}

		this.handlingDevices = true

		try {
			const available = await this.checkBluetoothAvailable()

			await this.refresh()

			const previous = this.lastBluetoothAvailable
			this.lastBluetoothAvailable = available

			// never change routing outside a call
			if (!this.active) {
				return
			}

			// ignore the changes we caused ourselves while routing settles
			if (previous === undefined || Date.now() < this.busyUntil) {
				return
			}

			if (available && !previous) {
				const target = this.bluetoothOutput

				if (target) {
					await this.setOutputDevice(target.id)
				}
			} else if (!available && previous) {
				const target =
					this.outputs.find((d) => !isBluetoothDevice(d)) ?? null

				if (target) {
					await this.setOutputDevice(target.id)
				}
			}
		} finally {
			this.handlingDevices = false
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

			if (!applied) {
				return false
			}

			this.busyUntil = Date.now() + ROUTING_SETTLE_MS

			const device = this.outputs.find((d) => d.id === deviceId) ?? null
			const isBluetooth = isBluetoothDevice(device)
			// high fidelity is a bluetooth only concept, anything else is a call
			const mode: AudioRouteMode = isBluetooth ? this.routeMode : "call"

			this.setState({ outputDeviceId: deviceId, routeMode: mode })
			// keep the native routing aligned with the resolved mode
			await strategy.setRouteMode?.(mode)

			await this.syncInput(isBluetooth, mode)

			return true
		} catch (error) {
			console.error("[audio] failed to set output device", error)
			return false
		}
	}

	async setInputDevice(deviceId: string): Promise<boolean> {
		const strategy = this.strategy

		if (!strategy?.setInputDevice) {
			return false
		}

		const device = this.inputs.find((d) => d.id === deviceId) ?? null

		// bluetooth input cannot be used while capturing from the builtin mic
		if (this.routeMode === "high-fidelity" && isBluetoothDevice(device)) {
			return false
		}

		try {
			const applied = await strategy.setInputDevice(deviceId)

			if (applied) {
				this.setState({ inputDeviceId: deviceId })
			}

			return applied
		} catch (error) {
			console.error("[audio] failed to set input device", error)
			return false
		}
	}

	async setRouteMode(mode: AudioRouteMode): Promise<boolean> {
		const strategy = this.strategy
		const selected = this.selectedOutput

		if (!strategy?.setRouteMode || !this.routeModeSupported) {
			return false
		}

		// only meaningful while outputting through bluetooth
		if (!isBluetoothDevice(selected)) {
			return false
		}

		try {
			this.busyUntil = Date.now() + ROUTING_SETTLE_MS

			const applied = await strategy.setRouteMode(mode)

			if (!applied) {
				return false
			}

			this.setState({ routeMode: mode })
			// in call mode the headset mic is used, in high fidelity the builtin one
			await this.syncInput(true, mode)

			if (
				mode === "call" &&
				strategy.setOutputDevice &&
				this.outputDeviceId
			) {
				// high fidelity releases the communication device, re-apply the
				// output so the headset is routed through the call path again
				await strategy.setOutputDevice(this.outputDeviceId)
			}

			return true
		} catch (error) {
			console.error("[audio] failed to set route mode", error)
			return false
		}
	}

	// keeps the input device coherent with the selected output and route mode,
	// without re-applying it when it already matches to avoid routing churn
	private async syncInput(
		isBluetoothOutput: boolean,
		mode: AudioRouteMode,
	): Promise<void> {
		const strategy = this.strategy

		if (!strategy?.setInputDevice) {
			return
		}

		const current =
			this.inputs.find((d) => d.id === this.inputDeviceId) ?? null

		let target: AudioDevice | null = null

		if (isBluetoothOutput && mode === "call") {
			if (isBluetoothDevice(current)) {
				return
			}

			target = this.bluetoothInput
		} else {
			if (
				current &&
				!isBluetoothDevice(current) &&
				current.type === "builtin-mic"
			) {
				return
			}

			target = this.builtinMic
		}

		if (!target) {
			return
		}

		const applied = await strategy.setInputDevice(target.id)

		if (applied) {
			this.setState({ inputDeviceId: target.id })
		}
	}
}

export const audioManager = new AudioManager()

export function useAudioStore(): AudioReactiveState
export function useAudioStore<U>(selector: (state: AudioReactiveState) => U): U
export function useAudioStore<U>(selector?: (state: AudioReactiveState) => U) {
	return audioManager.useStore(selector!)
}

export type {
	AudioDevice,
	AudioDeviceKind,
	AudioStrategy,
	AudioRouteMode,
} from "./types"

export * from "./processing"

export default useAudioStore
