export default (rtpParameters, kind) => {
	if (!rtpParameters.codecs || !Array.isArray(rtpParameters.codecs)) {
		throw new Error("Invalid rtpParameters: missing codecs")
	}

	for (const codec of rtpParameters.codecs) {
		if (!codec.mimeType || !codec.clockRate) {
			throw new Error("Invalid codec: missing mimeType or clockRate")
		}
	}

	// Validate that codecs match the expected kind
	if (kind) {
		const expectedPrefix = kind === "video" ? "video/" : "audio/"
		const hasMatchingCodec = rtpParameters.codecs.some((c) =>
			c.mimeType?.startsWith(expectedPrefix),
		)

		if (!hasMatchingCodec) {
			throw new Error(`Invalid rtpParameters: no ${kind} codecs found`)
		}
	}

	// Check for mixed media types
	const hasVideo = rtpParameters.codecs.some(
		(c) => c.kind === "video" || c.mimeType?.startsWith("video/"),
	)
	const hasAudio = rtpParameters.codecs.some(
		(c) => c.kind === "audio" || c.mimeType?.startsWith("audio/"),
	)

	if (hasVideo && hasAudio) {
		throw new Error("Invalid rtpParameters: contains multiple media types")
	}
}
