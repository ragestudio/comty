import React from "react"
import { Button, Radio } from "antd"

import "./index.less"

function getCurrentVideoSettings() {
	const instance = app.cores.mediartc.instance()
	const stream = instance.screenStream

	if (!stream) {
		return null
	}

	const videoTracks = stream.getVideoTracks()

	if (videoTracks.length === 0) {
		return null
	}

	const track = videoTracks[0]

	if (!track) {
		return null
	}

	const settings = track.getSettings()

	settings.resolution = `${settings.width}x${settings.height}`

	return settings
}

const ScreenShareOptionsDialog = ({ close }) => {
	const { resolutionsList, frameratesList } = app.cores.mediartc.vars()
	const trackSettings = getCurrentVideoSettings()

	const stopScreenShare = () => {
		const handlers = app.cores.mediartc.handlers()

		handlers.stopScreenShare()

		if (typeof close === "function") {
			close()
		}
	}

	const changeVideoStreamConstraints = (type, value) => {
		console.log({
			type: type,
			value: value,
		})

		if (type === "resolution") {
			const [width, height] = value.split("x").map(Number)

			app.cores.mediartc.handlers().changeScreenParams({
				width: width,
				height: height,
			})
		}

		if (type === "framerate") {
			app.cores.mediartc.handlers().changeScreenParams({
				frameRate: parseInt(value),
			})
		}
	}

	console.log({ trackSettings, resolutionsList, frameratesList })

	return (
		<div className="screenshare-options-dialog">
			<div>
				<p>Video Resolution</p>
				<Radio.Group
					options={resolutionsList}
					defaultValue={trackSettings.resolution}
					onChange={(e) =>
						changeVideoStreamConstraints(
							"resolution",
							e.target.value,
						)
					}
				/>
			</div>

			<div>
				<p>Video Framerate</p>
				<Radio.Group
					options={frameratesList}
					defaultValue={trackSettings.frameRate}
					onChange={(e) =>
						changeVideoStreamConstraints(
							"framerate",
							e.target.value,
						)
					}
				/>
			</div>

			<Button onClick={stopScreenShare}>Stop Screenshare</Button>
		</div>
	)
}

export function openDialog() {
	app.layout.modal.open(
		"screen-share-options-dialog",
		ScreenShareOptionsDialog,
	)
}

export default ScreenShareOptionsDialog
