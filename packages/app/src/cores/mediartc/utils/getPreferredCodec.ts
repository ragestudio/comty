import type {
	RtpCapabilities,
	RtpCodecCapability,
} from "mediasoup-client/types"

type SimdCapabilities = {
	avx512: boolean
	avx2: boolean
	sse42: boolean
	sse2: boolean
}

type CpuCapabilities = {
	cores: number
	arch: string
	simd: SimdCapabilities
}

const HW_DETECT_CODECS = [
	{
		mimeType: "video/h264",
		contentType:
			"video/h264;packetization-mode=1;profile-level-id=64001f;level-asymmetry-allowed=1",
	},
	{
		mimeType: "video/VP9",
		contentType: "video/VP9;profile-id=0",
	},
	{
		mimeType: "video/AV1",
		contentType: "video/AV1",
	},
]

let cachedHardwareCodecs: string[] | null = null
let cachedCpuCaps: CpuCapabilities | null = null

async function detectHardwareCodecs(): Promise<string[]> {
	const hardwareCodecs: string[] = []

	if (
		typeof navigator !== "undefined" &&
		navigator.mediaCapabilities?.encodingInfo
	) {
		for (const codec of HW_DETECT_CODECS) {
			try {
				const info = await navigator.mediaCapabilities.encodingInfo({
					type: "webrtc",
					video: {
						contentType: codec.contentType,
						width: 1920,
						height: 1080,
						bitrate: 5000000,
						framerate: 30,
					},
				})

				if (info.powerEfficient) {
					hardwareCodecs.push(codec.mimeType)
				}
			} catch {
				// codec not supported, skip
			}
		}
	}

	// fallback: desktop ipc if mediaCapabilities gave nothing
	if (
		hardwareCodecs.length === 0 &&
		typeof window !== "undefined" &&
		window.ipcRenderer?.invoke
	) {
		try {
			const ipcResult = await window.ipcRenderer.invoke("gpu:encode-caps")

			if (Array.isArray(ipcResult) && ipcResult.length > 0) {
				hardwareCodecs.push(...ipcResult)
			}
		} catch {
			// ipc not available
		}
	}

	return hardwareCodecs
}

async function fetchHardwareCodecs(): Promise<string[]> {
	if (cachedHardwareCodecs !== null) {
		return cachedHardwareCodecs
	}

	const codecs = await detectHardwareCodecs()
	console.debug("[codec] detected hardware codecs:", codecs)

	cachedHardwareCodecs = codecs
	return codecs
}

async function fetchCpuCapabilities(): Promise<CpuCapabilities | null> {
	if (cachedCpuCaps !== null) {
		return cachedCpuCaps
	}

	if (typeof window !== "undefined" && window.ipcRenderer?.invoke) {
		try {
			const caps = await window.ipcRenderer.invoke("cpu:info")

			if (caps && typeof caps.simd === "object") {
				cachedCpuCaps = caps
				return caps
			}
		} catch {
			// ipc not available
		}
	}

	cachedCpuCaps = null
	return null
}

// av1 software encoding needs 8+ threads, sse2 and avx2 to be viable
function canSoftwareAv1(cpuCaps: CpuCapabilities | null): boolean {
	if (!cpuCaps) return false

	return cpuCaps.cores >= 8 && cpuCaps.simd.sse2 && cpuCaps.simd.avx2
}

function buildDynamicPriority(
	hardwareCodecs: string[],
	cpuCaps: CpuCapabilities | null,
): string[] {
	const priority: string[] = []
	const av1Viable = canSoftwareAv1(cpuCaps)

	const norm = (c: string) => c.toLowerCase()
	const has = (s: string) => priority.some((p) => norm(p) === norm(s))
	const push = (c: string) => {
		if (!has(c)) priority.push(c)
	}

	// group hardware codecs by tier
	const hwAV1 = hardwareCodecs.filter((c) => norm(c).includes("av1"))
	const hwVP9 = hardwareCodecs.filter((c) => norm(c).includes("vp9"))
	const hwH264 = hardwareCodecs.filter((c) => norm(c).includes("h264"))
	const hwOther = hardwareCodecs.filter(
		(c) => !hwAV1.includes(c) && !hwVP9.includes(c) && !hwH264.includes(c),
	)

	// hardware av1, best possible
	for (const c of hwAV1) push(c)

	// use software av1 if cpu can handle it
	if (av1Viable) {
		push("video/AV1")
		push("video/av1")
	}

	// hardware vp9
	for (const c of hwVP9) push(c)

	// use software vp9 if cpu can handle it
	if (av1Viable) {
		push("video/VP9")
		push("video/vp9")
	}

	// hardware h264, safe fallback
	for (const c of hwH264) push(c)

	// other hardware
	for (const c of hwOther) push(c)

	// in the worst scenario, use h264 via software
	push("video/h264")
	push("video/H264")

	return priority
}

export async function getPreferredVideoCodec(
	rtpCapabilities: RtpCapabilities,
): Promise<RtpCodecCapability | null> {
	if (!rtpCapabilities?.codecs) {
		return null
	}

	const hardwareCodecs = await fetchHardwareCodecs()
	const cpuCaps = await fetchCpuCapabilities()

	const priority = buildDynamicPriority(hardwareCodecs, cpuCaps)

	console.debug("[codec] priority:", {
		hardware: hardwareCodecs,
		cpuCores: cpuCaps?.cores,
		cpuSimd: cpuCaps?.simd,
		av1Viable: canSoftwareAv1(cpuCaps),
		priority: priority.map((c) => c.toLowerCase()),
	})

	const videoCodecs = rtpCapabilities.codecs.filter((c) => c.kind === "video")

	for (const mimeType of priority) {
		const match = videoCodecs.find(
			(c) => c.mimeType.toLowerCase() === mimeType.toLowerCase(),
		)
		if (match) {
			console.debug("[codec] selected:", match.mimeType)
			return match
		}
	}

	console.debug("[codec] no match found, using first available")
	return videoCodecs[0] ?? null
}

export async function getPreferredAudioCodec(
	rtpCapabilities: RtpCapabilities,
): Promise<RtpCodecCapability | null> {
	if (!rtpCapabilities?.codecs) {
		return null
	}

	return (
		rtpCapabilities.codecs.find(
			(c) =>
				c.kind === "audio" && c.mimeType.toLowerCase() === "audio/opus",
		) ?? null
	)
}
