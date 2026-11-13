export function createAudioContext() {
	const AudioContextClass =
		window.AudioContext ?? (window as any).webkitAudioContext

	if (!AudioContextClass) {
		throw new Error("Audio decoding is not supported")
	}

	return new AudioContextClass()
}

export async function loadAudioBuffer(
	source: File | string,
): Promise<AudioBuffer> {
	let data: ArrayBuffer

	if (typeof source === "string") {
		const response = await fetch(source)

		if (!response.ok) {
			throw new Error("Failed to download the audio")
		}

		data = await response.arrayBuffer()
	} else {
		data = await source.arrayBuffer()
	}

	const context = createAudioContext()

	try {
		return await context.decodeAudioData(data)
	} finally {
		context.close()
	}
}

export function computePeaks(buffer: AudioBuffer, samples = 240): number[] {
	const channel = buffer.getChannelData(0)
	const blockSize = Math.max(1, Math.floor(channel.length / samples))
	const peaks: number[] = []

	for (let index = 0; index < samples; index++) {
		const start = index * blockSize
		const end = Math.min(start + blockSize, channel.length)

		let peak = 0

		for (let cursor = start; cursor < end; cursor++) {
			const value = Math.abs(channel[cursor])

			if (value > peak) peak = value
		}

		peaks.push(peak)
	}

	return peaks
}

export async function trimAudioBuffer(
	buffer: AudioBuffer,
	start: number,
	end: number,
): Promise<AudioBuffer> {
	const safeStart = Math.max(0, Math.min(start, buffer.duration))
	const safeEnd = Math.max(safeStart, Math.min(end, buffer.duration))
	const duration = Math.max(0.01, safeEnd - safeStart)

	const frames = Math.max(1, Math.floor(duration * buffer.sampleRate))
	const renderDuration = frames / buffer.sampleRate
	const context = new OfflineAudioContext(
		buffer.numberOfChannels,
		frames,
		buffer.sampleRate,
	)

	const source = context.createBufferSource()

	source.buffer = buffer
	source.connect(context.destination)
	source.start(0, safeStart, renderDuration)

	return await context.startRendering()
}

function writeString(view: DataView, offset: number, value: string) {
	for (let index = 0; index < value.length; index++) {
		view.setUint8(offset + index, value.charCodeAt(index))
	}
}

export function encodeWav(buffer: AudioBuffer): Blob {
	const channels = buffer.numberOfChannels
	const sampleRate = buffer.sampleRate
	const samples = buffer.length
	const bytesPerSample = 2
	const blockAlign = channels * bytesPerSample
	const dataSize = samples * blockAlign
	const arrayBuffer = new ArrayBuffer(44 + dataSize)
	const view = new DataView(arrayBuffer)

	writeString(view, 0, "RIFF")
	view.setUint32(4, 36 + dataSize, true)
	writeString(view, 8, "WAVE")
	writeString(view, 12, "fmt ")
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, channels, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * blockAlign, true)
	view.setUint16(32, blockAlign, true)
	view.setUint16(34, 16, true)
	writeString(view, 36, "data")
	view.setUint32(40, dataSize, true)

	const channelData: Float32Array[] = []

	for (let channel = 0; channel < channels; channel++) {
		channelData.push(buffer.getChannelData(channel))
	}

	let offset = 44

	for (let sample = 0; sample < samples; sample++) {
		for (let channel = 0; channel < channels; channel++) {
			const value = Math.max(
				-1,
				Math.min(1, channelData[channel][sample]),
			)

			view.setInt16(
				offset,
				value < 0 ? value * 0x8000 : value * 0x7fff,
				true,
			)

			offset += bytesPerSample
		}
	}

	return new Blob([arrayBuffer], { type: "audio/wav" })
}

export async function createTrimmedFile(
	buffer: AudioBuffer,
	start: number,
	end: number,
	name = "audio-clip.wav",
): Promise<File> {
	const trimmed = await trimAudioBuffer(buffer, start, end)
	const blob = encodeWav(trimmed)

	return new File([blob], name, { type: "audio/wav" })
}
