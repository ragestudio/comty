import path from "node:path"

import { contextBridge, ipcRenderer } from "electron"

import { isAddonAvailable, loadAddon } from "./addon.js"
import {
	createSharedAudioBuffer,
	SHARED_VERSION,
	SharedWord,
	type SharedLayout,
} from "./layout.js"
import {
	SYSAUDIO_BRIDGE,
	SYSAUDIO_REQUEST,
	type AppInfo,
	type AudioFormat,
	type BridgeControlRequest,
	type BridgeControlResponse,
	type SysAudioAddon,
	type SysAudioBridgeMessage,
} from "./types.js"

type ControlResult = Pick<BridgeControlResponse, "type" | "format">

export class SysAudioBridge {
	private addon: SysAudioAddon | null = null
	private buffer: SharedArrayBuffer | null = null
	private header: Int32Array | null = null
	private layout: SharedLayout | null = null
	private port: MessagePort | null = null
	private mainPid = 0
	private started = false
	private initializing: Promise<void> | null = null

	register(): void {
		contextBridge.exposeInMainWorld("__SYS_AUDIO__", {
			available: isAddonAvailable(),
			version: SHARED_VERSION,
		})

		window.addEventListener("message", this.onWindowMessage)
		window.addEventListener("beforeunload", this.onBeforeUnload)
	}

	private onWindowMessage = (event: MessageEvent): void => {
		if (event.source !== window) return
		if (event.data?.type !== SYSAUDIO_REQUEST) return

		void this.handleRequest()
	}

	private async handleRequest(): Promise<void> {
		try {
			await this.ensureInitialized()
		} catch (error) {
			console.error("[sysaudio] failed to initialize", error)
			return
		}

		if (!this.buffer || !this.layout) {
			return
		}

		// a new request starts a new control channel
		this.port?.close()

		const channel = new MessageChannel()

		this.port = channel.port1
		this.port.onmessage = (event) => {
			void this.onControlMessage(event.data)
		}
		this.port.start()

		const message: SysAudioBridgeMessage = {
			type: SYSAUDIO_BRIDGE,
			version: SHARED_VERSION,
			buffer: this.buffer,
			layout: this.layout,
			outputSupported: !!this.addon?.output_supported,
		}

		window.postMessage(message, "*", [channel.port2])
	}

	private ensureInitialized(): Promise<void> {
		if (!this.initializing) {
			this.initializing = this.initialize().catch((error) => {
				this.initializing = null
				throw error
			})
		}

		return this.initializing
	}

	private async initialize(): Promise<void> {
		const info = (await ipcRenderer.invoke("app:info")) as AppInfo

		this.mainPid = info.pid

		const shared = createSharedAudioBuffer()
		const addon = loadAddon(
			info.userData ? path.join(info.userData, "native") : undefined,
		)

		addon.initialize({
			excluded_pid: info.pid,
			node_name: info.isDev ? "comty-sysaudio-dev" : "comty-sysaudio",
			device_app_id: "comty.desktop",
			device_app_name: info.isDev ? "ComtyDev" : "Comty",
			device_app_icon_name: "comty",
		})

		addon.attach_shared_buffer(new Uint8Array(shared.buffer))

		this.buffer = shared.buffer
		this.header = shared.header
		this.layout = shared.layout
		this.addon = addon
	}

	private async onControlMessage(
		message: BridgeControlRequest,
	): Promise<void> {
		if (!message || typeof message.id !== "number") {
			return
		}

		let response: BridgeControlResponse

		try {
			response = {
				id: message.id,
				ok: true,
				...this.handleControl(message),
			}
		} catch (error) {
			response = {
				id: message.id,
				ok: false,
				type: "error",
				error: error instanceof Error ? error.message : String(error),
			}
		}

		this.port?.postMessage(response)
	}

	private handleControl(message: BridgeControlRequest): ControlResult {
		if (!this.addon) {
			throw new Error("SysAudio is not initialized")
		}

		switch (message.type) {
			case "start-capture": {
				if (!this.started) {
					this.resetCaptureState()
					this.addon.start_capture(this.mainPid)
					this.started = true
				}

				return { type: "capture-started", format: this.readFormat() }
			}

			case "stop-capture": {
				this.addon.stop_capture()
				this.started = false

				return { type: "capture-stopped" }
			}

			case "get-format": {
				return { type: "format", format: this.readFormat() }
			}

			default: {
				throw new Error(`Unknown control message: ${message.type}`)
			}
		}
	}

	private resetCaptureState(): void {
		if (!this.header) return

		Atomics.store(this.header, SharedWord.SampleRate, 0)
		Atomics.store(this.header, SharedWord.Channels, 0)
		Atomics.store(this.header, SharedWord.BitsPerSample, 0)
		Atomics.store(this.header, SharedWord.Format, 0)
		Atomics.store(this.header, SharedWord.CaptureWrite, 0)
		Atomics.store(this.header, SharedWord.CaptureRead, 0)
	}

	private readFormat(): AudioFormat {
		if (!this.header) {
			return {
				sampleRate: 0,
				channels: 0,
				bitsPerSample: 0,
			}
		}

		return {
			sampleRate: Atomics.load(this.header, SharedWord.SampleRate),
			channels: Atomics.load(this.header, SharedWord.Channels),
			bitsPerSample: Atomics.load(this.header, SharedWord.BitsPerSample),
			format: Atomics.load(this.header, SharedWord.Format),
		}
	}

	private onBeforeUnload = (): void => {
		this.started = false
		this.port?.close()
		this.port = null

		if (this.addon) {
			this.addon.stop_capture()
			this.addon.detach_shared_buffer()
			this.addon.stop()
		}

		this.addon = null
		this.initializing = null
	}
}

export default SysAudioBridge
