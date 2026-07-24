import type { RtpEncodingParameters } from "mediasoup-client/types"

export default {
	maxScreenBitrate: 12000000,
	audioEncodingParams: {
		dtx: true,
		maxBitrate: 32000,
		priority: "high",
		networkPriority: "high",
	} satisfies RtpEncodingParameters,
	cameraVideoEncodingParams: {
		maxBitrate: 3000000,
		maxFramerate: 30,
		priority: "high",
		networkPriority: "high",
	} satisfies RtpEncodingParameters,
	screenVideoEncodingParams: {
		maxBitrate: 5000000,
		maxFramerate: 90,
		priority: "high",
		networkPriority: "high",
	} satisfies RtpEncodingParameters,
	screenAudioEncodingParams: {
		dtx: false,
		maxBitrate: 128000,
		priority: "high",
		networkPriority: "high",
	} satisfies RtpEncodingParameters,
}
