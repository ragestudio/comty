import {
	AudioBufferSource,
	BufferTarget,
	Output,
	WavOutputFormat,
} from "mediabunny"

const PEAK_STRIDE = 64

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
	// sample a subset of each block, enough for a waveform and much cheaper
	// than walking every sample of long files
	const stride = Math.max(1, Math.floor(blockSize / PEAK_STRIDE))
	const peaks: number[] = []

	for (let index = 0; index < samples; index++) {
		const start = index * blockSize
		const end = Math.min(start + blockSize, channel.length)

		let peak = 0

		for (let cursor = start; cursor < end; cursor += stride) {
			const value = Math.abs(channel[cursor])

			if (value > peak) peak = value
		}

		peaks.push(peak)
	}

	return peaks
}

export function sliceAudioBuffer(
	buffer: AudioBuffer,
	start: number,
	end: number,
): AudioBuffer {
	const sampleRate = buffer.sampleRate
	const startFrame = Math.max(
		0,
		Math.min(Math.floor(start * sampleRate), buffer.length - 1),
	)
	const endFrame = Math.min(
		buffer.length,
		Math.max(Math.ceil(end * sampleRate), startFrame + 1),
	)
	const frames = Math.max(1, endFrame - startFrame)

	const trimmed = new AudioBuffer({
		length: frames,
		numberOfChannels: buffer.numberOfChannels,
		sampleRate,
	})

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const data = buffer
			.getChannelData(channel)
			.subarray(startFrame, startFrame + frames)

		trimmed.copyToChannel(data, channel)
	}

	return trimmed
}

export async function createTrimmedFile(
	buffer: AudioBuffer,
	start: number,
	end: number,
	name = "audio-clip.wav",
): Promise<File> {
	const trimmed = sliceAudioBuffer(buffer, start, end)

	const output = new Output({
		format: new WavOutputFormat(),
		target: new BufferTarget(),
	})

	const source = new AudioBufferSource({
		codec: "pcm-s16",
	})

	output.addAudioTrack(source)

	await output.start()
	await source.add(trimmed)
	source.close()
	await output.finalize()

	const data = output.target.buffer

	if (!data) {
		throw new Error("Failed to encode the audio clip")
	}

	return new File([data], name, { type: "audio/wav" })
}
