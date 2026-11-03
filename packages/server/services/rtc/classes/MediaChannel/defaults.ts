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
			// constrained baseline, first so clients default to the profile that
			// every runtime can decode (chromium and the react native fork)
			kind: "video",
			mimeType: "video/h264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "42e01f",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			// constrained high, keeping it constrained avoids producing a profile
			// the react native fork does not advertise
			kind: "video",
			mimeType: "video/h264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "640c1f",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/AV1",
			clockRate: 90000,
		},
		{
			kind: "video",
			mimeType: "video/vp9",
			clockRate: 90000,
			parameters: {
				"profile-id": 0,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/vp8",
			clockRate: 90000,
			parameters: {
				"x-google-start-bitrate": 1000,
			},
		},
	],
}
