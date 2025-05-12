import React from "react"
import Hls from "hls.js"

const StreamPreview = ({ profile }) => {
	const videoRef = React.useRef(null)
	const hlsInstance = React.useRef(null)

	React.useEffect(() => {
		hlsInstance.current = new Hls({
			maxLiveSyncPlaybackRate: 1.5,
			strategy: "bandwidth",
			autoplay: true,
		})

		hlsInstance.current.attachMedia(videoRef.current)

		hlsInstance.current.on(Hls.Events.MEDIA_ATTACHED, () => {
			hlsInstance.current.loadSource(profile.sources.hls)
		})

		videoRef.current.addEventListener("play", () => {
			console.log("[HLS] Syncing to last position")
			videoRef.current.currentTime = hlsInstance.current.liveSyncPosition
		})

		videoRef.current.play()

		return () => {
			hlsInstance.current.destroy()
		}
	}, [])

	return (
		<video
			muted
			autoplay
			controls
			ref={videoRef}
			id="stream_preview_player"
		/>
	)
}

export default StreamPreview
