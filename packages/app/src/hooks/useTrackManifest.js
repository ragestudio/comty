import { useState, useEffect } from "react"

export default (playerTrackManifest) => {
	const [trackManifest, setTrackManifest] = useState(null)

	useEffect(() => {
		if (
			JSON.stringify(playerTrackManifest) !==
			JSON.stringify(trackManifest)
		) {
			setTrackManifest(playerTrackManifest)
		}
	}, [playerTrackManifest, trackManifest])

	return {
		trackManifest,
		setTrackManifest,
	}
}
