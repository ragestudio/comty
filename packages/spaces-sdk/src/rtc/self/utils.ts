import type {
	RtpCapabilities,
	RtpCodecCapability,
} from "mediasoup-client/types"
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
