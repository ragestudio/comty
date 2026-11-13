import child_process from "node:child_process"

import { SOUNDPAD_MAX_DURATION_SECONDS } from "@comty/shared/types/spaces/soundpad"

import { FFMPEGLib } from "@shared-classes/FFMPEGLib"

const FFPROBE_TIMEOUT_MS = 15000

const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::", "::1"])
const PRIVATE_HOSTNAME_SUFFIXES = [".localhost", ".local", ".internal"]

let ffprobeBin: string | null | undefined

function getFFprobeBin(): string | null {
	if (ffprobeBin === undefined) {
		ffprobeBin = new FFMPEGLib().ffprobeBin
	}

	return ffprobeBin
}

function isPrivateHostname(hostname: string) {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")

	if (PRIVATE_HOSTNAMES.has(host)) return true
	if (PRIVATE_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
		return true
	}

	if (host.includes(":")) {
		const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(host)

		if (mapped) return isPrivateHostname(mapped[1])

		return (
			host === "::" ||
			host === "::1" ||
			host.startsWith("fc") ||
			host.startsWith("fd") ||
			host.startsWith("fe80:")
		)
	}

	if (
		host.startsWith("127.") ||
		host.startsWith("10.") ||
		host.startsWith("192.168.") ||
		host.startsWith("169.254.")
	) {
		return true
	}

	const privateRange = /^172\.(\d{1,2})\./.exec(host)

	if (privateRange) {
		const second = Number.parseInt(privateRange[1], 10)

		if (second >= 16 && second <= 31) return true
	}

	return false
}

function probeDuration(src: string): Promise<number | null> {
	const bin = getFFprobeBin()

	if (!bin) return Promise.resolve(null)

	return new Promise((resolve) => {
		child_process.execFile(
			bin,
			[
				"-v",
				"error",
				"-show_entries",
				"format=duration",
				"-of",
				"default=noprint_wrappers=1:nokey=1",
				src,
			],
			{
				timeout: FFPROBE_TIMEOUT_MS,
				maxBuffer: 1024 * 1024,
			},
			(error, stdout) => {
				if (error) {
					resolve(null)
					return
				}

				const duration = Number.parseFloat(String(stdout).trim())

				resolve(Number.isFinite(duration) ? duration : null)
			},
		)
	})
}

export async function assertSoundpadDuration(src: string) {
	const bin = getFFprobeBin()

	// the duration cannot be verified without ffprobe
	if (!bin) return

	const hostname = new URL(src).hostname

	if (isPrivateHostname(hostname)) {
		throw new OperationError(400, "src must be a public URL")
	}

	const duration = await probeDuration(src)

	if (duration === null) {
		throw new OperationError(400, "Unable to read audio duration")
	}

	if (duration > SOUNDPAD_MAX_DURATION_SECONDS) {
		throw new OperationError(
			400,
			`Sound must be ${SOUNDPAD_MAX_DURATION_SECONDS} seconds or shorter`,
		)
	}
}
