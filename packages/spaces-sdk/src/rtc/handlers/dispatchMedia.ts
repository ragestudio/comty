import type { RTC } from ".."
import type { StreamsKinds } from "../self/streams/base"
import type {
	RtpCapabilities,
	RtpCodecCapability,
} from "mediasoup-client/types"

import defaults from "../defaults"

type DispatchMediaParams = {
	type: keyof typeof StreamsKinds
	codec?: RtpCodecCapability
}

const SCREEN_VIDEO_CODECS = [
	"video/h264",
	"video/vp9",
	"video/vp8",
	"video/av1",
]

function pickVideoCodec(
	capabilities: RtpCapabilities,
	preferred?: RtpCodecCapability,
): RtpCodecCapability | undefined {
	const videoCodecs = (capabilities.codecs ?? []).filter(
		(codec) =>
			codec.kind === "video" &&
			!codec.mimeType?.toLowerCase().includes("rtx"),
	)

	if (preferred?.mimeType) {
		const match = videoCodecs.find(
			(codec) =>
				codec.mimeType?.toLowerCase() ===
				preferred.mimeType.toLowerCase(),
		)

		if (match) return match
	}

	for (const mimeType of SCREEN_VIDEO_CODECS) {
		const match = videoCodecs.find(
			(codec) => codec.mimeType?.toLowerCase() === mimeType,
		)

		if (match) return match
	}

	return videoCodecs[0]
}

async function createMic(rtc: RTC, params: DispatchMediaParams) {
	const mic = await rtc.self.createStream<"mic">("mic")

	if (!mic.stream) {
		throw new Error("mic stream not available")
	}

	const audioTrack =
		mic.stream.getAudioTracks()[0] as unknown as MediaStreamTrack

	const audioCodec = rtc.rtpCapabilities.codecs?.find(
		(codec) => codec.kind === "audio",
	)

	if (!audioCodec) {
		throw new Error("audio codec not found")
	}

	console.log("using audio codec", audioCodec)

	const producer = await rtc.producers.produce({
		appData: { mediaTag: "user-mic" },
		track: audioTrack,
		codec: audioCodec,
		codecOptions: {
			opusStereo: false,
			opusDtx: true,
		},
		encodings: [
			{
				...defaults.audioEncodingParams,
				dtx: true,
			},
		],
	})

	return { mic, producer }
}

async function createScreenshare(rtc: RTC, params: DispatchMediaParams) {
	const screen = await rtc.self.createStream<"screen">("screen")

	if (!screen.stream) {
		throw new Error("screen stream not available")
	}

	const videoTrack =
		screen.stream.getVideoTracks()[0] as unknown as MediaStreamTrack

	console.log("screen stream", screen.stream, screen.stream.getTracks())

	if (!rtc.device) {
		throw new Error("Device not available")
	}

	const videoCodec = pickVideoCodec(
		rtc.device.sendRtpCapabilities,
		params.codec,
	)

	console.log("using video codec", videoCodec)

	if (!videoCodec) {
		throw new Error("video codec not found")
	}

	const producer = await rtc.producers.produce({
		appData: {
			mediaTag: "screen-video",
		},
		codec: videoCodec,
		encodings: [{ ...defaults.screenVideoEncodingParams }],
		track: videoTrack,
	})

	return { producer, screen }
}

export default async function (this: RTC, params: DispatchMediaParams) {
	if (!this.device) return

	switch (params.type) {
		case "screen":
			await createScreenshare(this, params)
			break
		case "mic":
			await createMic(this, params)
			break
		default:
			throw new Error(`Unknown stream type: ${params.type}`)
	}
}
