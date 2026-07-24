import os from "os"
import fs from "fs"

function LinuxReadCPUSimd() {
	const cpuinfo = fs.readFileSync("/proc/cpuinfo", "utf-8")
	const flagsLine = cpuinfo
		.split("\n")
		.find((line) => line.startsWith("flags"))

	if (flagsLine) {
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

	return null
}

export default function () {
	const caps = {
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

	if (caps.platform === "linux") {
		try {
			const simd = LinuxReadCPUSimd()

			if (simd) {
				caps.simd = simd
			}
		} catch (error) {
			console.error("[cpu] failed to read cpu features:", error)
		}
	}

	console.log("[cpu] capabilities:", caps)

	return caps
}
