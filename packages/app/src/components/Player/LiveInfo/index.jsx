import React from "react"
import SSEEvents from "@classes/SSEEvents"

import { MdPlayCircle, MdHeadphones } from "react-icons/md"

import "./index.less"

const LiveInfo = ({ radioId, initialData }) => {
	const [data, setData] = React.useState(initialData ?? {})

	const eventManager = React.useRef(null)

	React.useEffect(() => {
		if (eventManager.current) {
			eventManager.current.close()
		}

		eventManager.current = new SSEEvents(
			`${app.cores.api.client().mainOrigin}/music/radio/sse/radio:${radioId}`,
			{
				update: (data) => {
					if (typeof data.now_playing === "string") {
						data.now_playing = JSON.parse(data.now_playing)
					}

					console.log(`Radio data updated`, data)
					setData(data)
				},
			},
		)

		return () => {
			eventManager.current.close()
		}
	}, [radioId])

	return (
		<div className="live-info">
			{data.now_playing && (
				<>
					<div className="live-info-title">
						<MdPlayCircle /> {data.now_playing.song.text}
					</div>
					<div className="live-info-listeners">
						<MdHeadphones /> {data.listeners}
					</div>
				</>
			)}
		</div>
	)
}

export default LiveInfo
