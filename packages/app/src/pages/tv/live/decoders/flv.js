import mpegts from "mpegts.js"

export default async (player, source, { onSourceEnd } = {}) => {
	if (!source) {
		console.error("Stream source is not defined")
		return false
	}

	const decoderInstance = mpegts.createPlayer({
		type: "flv",
		isLive: true,
		enableWorker: true,
		url: source,
	})

	if (typeof onSourceEnd === "function") {
		decoderInstance.on(mpegts.Events.ERROR, onSourceEnd)
	}

	decoderInstance.attachMediaElement(player)

	decoderInstance.load()

	await decoderInstance.play().catch((error) => {
		console.error(error)
	})

	return decoderInstance
}
