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
		// do not wait for the promise, chromium keeps it pending until the page
		// receives a user gesture
		ctx.resume().catch(() => {})
	}

	return ctx
}

let unlockInstalled = false

// a resume can be ignored when it happens outside a gesture, so keep retrying on
// every interaction until the context is actually running
export function installAudioUnlock(): void {
	if (unlockInstalled || typeof window === "undefined") return

	unlockInstalled = true

	const unlock = () => {
		const ctx = getAudioContext()

		if (ctx.state === "running") return

		ctx.resume().catch(() => {})
	}

	window.addEventListener("pointerdown", unlock, { capture: true })
	window.addEventListener("keydown", unlock, { capture: true })
}

// same as above for a context created elsewhere (e.g. the sysaudio output bus)
const keptContexts = new WeakSet<AudioContext>()

export function keepContextRunning(ctx: AudioContext): void {
	if (typeof window === "undefined" || keptContexts.has(ctx)) return

	keptContexts.add(ctx)

	const resume = () => {
		if (ctx.state === "running") return

		ctx.resume().catch(() => {})
	}

	window.addEventListener("pointerdown", resume, { capture: true })
	window.addEventListener("keydown", resume, { capture: true })
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
		// a suspended context may reject or ignore the sink change, the resume
		// promise stays pending until a gesture so it is not awaited
		if (ctx.state !== "running") {
			ctx.resume().catch(() => {})
		}

		await ctx.setSinkId(deviceId)
		return true
	} catch (error) {
		console.error("[spaces-adapter] failed to set audio sink", error)
		return false
	}
}
