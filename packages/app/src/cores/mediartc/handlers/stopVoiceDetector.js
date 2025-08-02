import setFind from "../utils/setFind"

export default async function (userId) {
	// stop voice detection
	const voiceDetector = setFind(
		this.voiceDetectors,
		(item) => item.userId === userId,
	)

	if (voiceDetector) {
		voiceDetector.detector.destroy()
		this.voiceDetectors.delete(voiceDetector)
	}
}
