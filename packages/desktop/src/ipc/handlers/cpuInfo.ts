import os from "node:os"
import fs from "node:fs"

interface SimdCapabilities {
	avx512: boolean
	avx2: boolean
	sse42: boolean
	sse2: boolean
}

export interface CpuCapabilities {
	cores: number
	arch: string
	platform: NodeJS.Platform
	simd: SimdCapabilities
}

function readLinuxSimd(): SimdCapabilities | null {
	const cpuinfo = fs.readFileSync("/proc/cpuinfo", "utf-8")

	const flagsLine = cpuinfo.split("\n").find((line) => line.startsWith("flags"))

	if (!flagsLine) {
		return null
	}

	const flags = flagsLine.split(":")[1]?.trim()?.split(" ") ?? []

	return {
		avx512:
			flags.includes("avx512f") &&
			flags.includes("avx512bw") &&
			flags.includes("avx512vl"),
		avx2: flags.includes("avx2"),
		sse42: flags.includes("sse4_2"),
		sse2: flags.includes("sse2"),
	}
}

export default function getCpuInfo(): CpuCapabilities {
	const capabilities: CpuCapabilities = {
		cores: os.cpus().length,
		arch: os.arch(),
		platform: os.platform(),
		simd: {
			avx512: false,
			avx2: false,
			sse42: false,
			sse2: false,
		},
	}

	if (capabilities.platform === "linux") {
		try {
			const simd = readLinuxSimd()

			if (simd) {
				capabilities.simd = simd
			}
		} catch (error) {
			console.error("[cpu] failed to read cpu features:", error)
		}
	}

	console.log("[cpu] capabilities:", capabilities)

	return capabilities
}
