// shared memory layout, keep in sync with the electron preload and the native
// addon (packages/desktop/src/sysaudio/layout.ts and
// packages/desktop/addons/sysaudio/src/shared_buffer.hpp)
export const SYSAUDIO_REQUEST = "sysaudio:request"
export const SYSAUDIO_BRIDGE = "sysaudio:bridge"

export const HEADER_BYTES = 64
export const HEADER_WORDS = HEADER_BYTES / 4

export const SharedWord = {
	Magic: 0,
	Version: 1,
	SampleRate: 2,
	Channels: 3,
	BitsPerSample: 4,
	Format: 5,
	CaptureWrite: 6,
	CaptureRead: 7,
	PlaybackWrite: 8,
	PlaybackRead: 9,
	CaptureCapacity: 10,
	PlaybackCapacity: 11,
	CaptureActive: 12,
} as const

export interface SharedLayout {
	headerBytes: number
	captureOffset: number
	captureCapacity: number
	playbackOffset: number
	playbackCapacity: number
}

export interface AudioFormat {
	sampleRate: number
	channels: number
	bitsPerSample: number
	format?: number
}

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

export interface SysAudioWindow extends Window {
	__SYS_AUDIO__?: {
		available: boolean
		version: number
	}
	ipcRenderer?: {
		invoke(channel: string, ...args: unknown[]): Promise<unknown>
		send(channel: string, ...args: unknown[]): void
		on(channel: string, listener: (...args: any[]) => void): void
	}
}
