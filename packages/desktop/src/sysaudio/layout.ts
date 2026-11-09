// shared memory layout, keep in sync with the native addon
// (addons/sysaudio/src/shared_buffer.hpp) and the spaces-sdk
export const SHARED_MAGIC = 0x53594155
export const SHARED_VERSION = 1
export const HEADER_BYTES = 64
export const HEADER_WORDS = HEADER_BYTES / 4

export const CAPTURE_CAPACITY = 256 * 1024
export const PLAYBACK_CAPACITY = 256 * 1024

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

export interface SharedAudioBuffer {
	buffer: SharedArrayBuffer
	header: Int32Array
	layout: SharedLayout
}

export function createSharedAudioBuffer(): SharedAudioBuffer {
	const buffer = new SharedArrayBuffer(
		HEADER_BYTES + CAPTURE_CAPACITY + PLAYBACK_CAPACITY,
	)
	const header = new Int32Array(buffer, 0, HEADER_WORDS)

	header[SharedWord.Magic] = SHARED_MAGIC
	header[SharedWord.Version] = SHARED_VERSION
	header[SharedWord.CaptureCapacity] = CAPTURE_CAPACITY
	header[SharedWord.PlaybackCapacity] = PLAYBACK_CAPACITY

	return {
		buffer,
		header,
		layout: {
			headerBytes: HEADER_BYTES,
			captureOffset: HEADER_BYTES,
			captureCapacity: CAPTURE_CAPACITY,
			playbackOffset: HEADER_BYTES + CAPTURE_CAPACITY,
			playbackCapacity: PLAYBACK_CAPACITY,
		},
	}
}
