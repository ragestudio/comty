import type { SharedLayout } from "./layout.js"

export interface AudioFormat {
	sampleRate: number
	channels: number
	bitsPerSample: number
	format?: number
}

export interface InitializeParams {
	excluded_pid: number
	node_name: string
	device_app_id: string
	device_app_name: string
	device_app_icon_name: string
}

export interface SysAudioAddon {
	initialize(params: InitializeParams): void
	start_capture(
		excludedPid: number,
		callback?: (buffer: Buffer, format: AudioFormat) => void,
	): void
	stop_capture(): void
	stop(): void
	output(buffer: Buffer, format: AudioFormat): void
	attach_shared_buffer(view: Uint8Array): void
	detach_shared_buffer(): void
	get_format(): AudioFormat
	readonly output_supported: boolean
}

export interface AppInfo {
	pid: number
	isDev: boolean
}

export const SYSAUDIO_REQUEST = "sysaudio:request"
export const SYSAUDIO_BRIDGE = "sysaudio:bridge"

export interface SysAudioBridgeMessage {
	type: typeof SYSAUDIO_BRIDGE
	version: number
	buffer: SharedArrayBuffer
	layout: SharedLayout
	outputSupported: boolean
}

export interface BridgeControlRequest {
	id: number
	type: "start-capture" | "stop-capture" | "get-format"
}

export interface BridgeControlResponse {
	id: number
	ok: boolean
	type?: "capture-started" | "capture-stopped" | "format" | "error"
	format?: AudioFormat
	error?: string
}
