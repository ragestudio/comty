export default {
	mediaCodecs: [
		{
			kind: "audio",
			mimeType: "audio/opus",
			clockRate: 48000,
			channels: 2,
			parameters: {
				useinbandfec: 1,
				usedtx: 1,
				minptime: 10,
				maxplaybackrate: 48000,
			},
			headerExtensions: [
				{
					uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
					kind: "audio",
				},
			],
		},
		{
			kind: "video",
			mimeType: "video/AV1",
			clockRate: 90000,
		},
		{
			kind: "video",
			mimeType: "video/h264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "64001f",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/vp9",
			clockRate: 90000,
			parameters: {
				"profile-id": 2,
				"x-google-start-bitrate": 1000,
			},
		},
	],
}
