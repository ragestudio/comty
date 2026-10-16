import type {
	RtpCapabilities,
	RtpCodecCapability,
} from "mediasoup-client/types"

import defaults from "@/rtc/defaults"
import { SCREEN_VIDEO_CODECS } from "./constants"

export function pickVideoCodec(
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

// scale the screen encoding to the captured resolution and framerate, so the
// bitrate matches what is actually being shared
export function computeScreenEncoding(
	track: MediaStreamTrack,
	fallbackFramerate = 30,
) {
	const settings = track.getSettings()

	const width = settings.width ?? 1920
	const height = settings.height ?? 1080
	const framerate = settings.frameRate ?? fallbackFramerate

	const pixelRatio = (width * height) / (1920 * 1080)
	const fpsRatio = framerate / 30

	const maxBitrate = Math.min(
		Math.round(
			defaults.screenVideoEncodingParams.maxBitrate *
				pixelRatio *
				fpsRatio,
		),
		defaults.maxScreenBitrate,
	)

	return {
		...defaults.screenVideoEncodingParams,
		maxBitrate,
		maxFramerate: framerate,
	}
}
