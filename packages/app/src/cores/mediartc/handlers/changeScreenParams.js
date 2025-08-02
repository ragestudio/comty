export default function (params = {}) {
	if (!this.screenStream) {
		throw new Error("Screen stream not initialized")
	}

	const videoTracks = this.screenStream.getVideoTracks()

	for (const track of videoTracks) {
		let update = {
			...track.getSettings(),
			...params,
		}

		track.applyConstraints(update)

		this.console.debug("changing screen video track constraints to", params)
	}
}
