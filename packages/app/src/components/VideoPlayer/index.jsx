import React from "react"
import HLS from "hls.js"

import "./index.less"

const VideoPlayer = (props) => {
	const videoRef = React.createRef()

	const [initializing, setInitializing] = React.useState(true)
	const [hls, setHls] = React.useState(null)

	React.useEffect(() => {
		setInitializing(true)

		const hlsInstance = new HLS()

		setHls(hlsInstance)

		hlsInstance.loadSource(props.src)
		hlsInstance.attachMedia(videoRef.current)

		hlsInstance.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
			console.log(event, data)
		})

		setInitializing(false)

		return () => {
			hlsInstance.destroy()
		}
	}, [])

	React.useEffect(() => {
		if (hls) {
			hls.loadSource(props.src)
		}
	}, [props.src])

	return (
		<div className="video-player">
			<video
				ref={videoRef}
				className="video-player-component"
				controls={props.controls}
			/>
		</div>
	)
}

export default VideoPlayer
