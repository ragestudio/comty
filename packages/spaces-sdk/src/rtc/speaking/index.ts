import type {
	SpeakingChangeHandler,
	SpeakingStrategy,
	SpeakingTarget,
} from "./types"

import nativeStrategy from "./strategies/native"
import webStrategy from "./strategies/web"
import analyserStrategy from "./strategies/analyser"
import loggerBase from "@/utils/logger"

export const logger = loggerBase.child("voice-detection")

// ordered by priority. the first strategy that supports the target and can
// attach wins, so a failing strategy never disables detection
const strategies: SpeakingStrategy[] = [
	nativeStrategy,
	webStrategy,
	analyserStrategy,
]

export function registerSpeakingStrategy(strategy: SpeakingStrategy) {
	strategies.unshift(strategy)
}

export function resolveSpeakingStrategy(
	target: SpeakingTarget,
): SpeakingStrategy | null {
	return strategies.find((strategy) => strategy.supports(target)) ?? null
}

// attaches speaking detection to a target and returns a detach function, or
// null when no strategy could be attached by the current runtime
export function attachSpeakingDetection(
	target: SpeakingTarget,
	onChange: SpeakingChangeHandler,
): (() => void) | null {
	for (const strategy of strategies) {
		if (!strategy.supports(target)) continue

		try {
			const detach = strategy.attach(target, onChange)

			if (!detach) continue

			logger.debug(
				`speaking detection attached to ${target.role} [${target.id}] using ${strategy.name}`,
			)

			return detach
		} catch (error) {
			// a strategy must never break the media setup, so try the next one
			logger.warn(
				`${strategy.name} failed to attach to ${target.role} [${target.id}]`,
				error,
			)
		}
	}

	logger.debug(
		`no speaking detection strategy available for ${target.role} [${target.id}]`,
	)

	return null
}

export type {
	SpeakingChangeHandler,
	SpeakingRole,
	SpeakingStrategy,
	SpeakingTarget,
} from "./types"

export default attachSpeakingDetection
