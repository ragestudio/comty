// single audio context shared by playback and mic processing. created lazily so
// it only exists once the app actually starts using audio
let context: AudioContext | null = null

export function getAudioContext(): AudioContext {
	if (!context) {
		try {
			context = new AudioContext({
				latencyHint: "interactive",
				sampleRate: 48000,
			})
		} catch {
			context = new AudioContext({ latencyHint: "interactive" })
		}
	}

	return context
}

// browsers keep the context suspended until a user gesture, so every audio path
// tries to resume it when it starts playing or capturing
export async function resumeAudioContext(): Promise<AudioContext> {
	const ctx = getAudioContext()

	if (ctx.state === "suspended") {
		await ctx.resume().catch(() => {})
	}

	return ctx
}

export function dbToGain(db: number): number {
	return Math.pow(10, db / 20)
}

type SinkCapableContext = AudioContext & {
	setSinkId?: (deviceId: string) => Promise<void>
}

// routes every node wired to context.destination to the given output device.
// only chromium exposes setSinkId on the audio context for now
export async function setAudioSink(deviceId: string): Promise<boolean> {
	const ctx = getAudioContext() as SinkCapableContext

	if (typeof ctx.setSinkId !== "function") {
		return false
	}

	try {
		await ctx.setSinkId(deviceId)
		return true
	} catch (error) {
		console.error("[spaces-adapter] failed to set audio sink", error)
		return false
	}
}
