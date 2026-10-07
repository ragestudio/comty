import type {
	SpeakingChangeHandler,
	SpeakingStrategy,
	SpeakingTarget,
} from "./types"

import nativeStrategy from "./strategies/native"
import webStrategy from "./strategies/web"

// ordered by priority, the first supported strategy wins, so we prefer the
// native frame transform when available and fall back to the web api
const strategies: SpeakingStrategy[] = [nativeStrategy, webStrategy]

export function registerSpeakingStrategy(strategy: SpeakingStrategy) {
	strategies.unshift(strategy)
}

export function resolveSpeakingStrategy(
	target: SpeakingTarget,
): SpeakingStrategy | null {
	return strategies.find((strategy) => strategy.supports(target)) ?? null
}

// attaches speaking detection to a target and returns a detach function, or
// null when no strategy is supported by the current runtime
export function attachSpeakingDetection(
	target: SpeakingTarget,
	onChange: SpeakingChangeHandler,
): (() => void) | null {
	const strategy = resolveSpeakingStrategy(target)

	if (!strategy) {
		console.debug(
			`[webrtc] no speaking detection strategy for ${target.role} [${target.id}]`,
		)

		return null
	}

	let detach: (() => void) | null = null

	try {
		detach = strategy.attach(target, onChange)
	} catch (error) {
		// attach must never break the media setup, for example when the native
		// binary does not expose the transform api yet
		console.warn(
			`[webrtc] failed to attach peaking detection to ${target.role} [${target.id}]`,
			error,
		)

		return null
	}

	if (detach) {
		console.debug(
			`[webrtc] speaking detection attached to ${target.role} [${target.id}] using ${strategy.name}`,
		)
	}

	return detach
}

export type {
	SpeakingChangeHandler,
	SpeakingRole,
	SpeakingStrategy,
	SpeakingTarget,
} from "./types"

export default attachSpeakingDetection
