export default {
	audioEncodingParams: {
		maxBitrate: 32000,
		priority: "high",
		networkPriority: "high",
		dtx: true,
	},
	cameraVideoEncodingParams: {
		maxBitrate: 3000000,
		maxFramerate: 30,
		priority: "high",
		networkPriority: "high",
	},
	screenVideoEncodingParams: {
		maxBitrate: 5000000,
		maxFramerate: 30,
		priority: "high",
		networkPriority: "high",
	},
	maxScreenBitrate: 12000000,
	screenAudioEncodingParams: {
		maxBitrate: 128000,
		priority: "high",
		networkPriority: "high",
	},
}
