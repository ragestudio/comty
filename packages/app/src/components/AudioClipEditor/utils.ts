import type { AudioClipRange } from "./types"

export const MIN_CLIP_DURATION = 0.1

export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value))

export const formatTime = (seconds: number) => `${seconds.toFixed(2)}s`

export const resolveInitialRange = (
	duration: number,
	maxDuration: number,
	initialRange?: Partial<Pick<AudioClipRange, "start" | "end">>,
) => {
	const maxEnd = Math.min(duration, maxDuration)
	const start = clamp(
		initialRange?.start ?? 0,
		0,
		Math.max(0, duration - MIN_CLIP_DURATION),
	)
	const end = clamp(
		initialRange?.end ?? maxEnd,
		start + MIN_CLIP_DURATION,
		duration,
	)

	return {
		start,
		end: Math.min(end, start + maxDuration),
	}
}
