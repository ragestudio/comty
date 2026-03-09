import React from "react"
import Button from "@ui/Button"
import { Select } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

function getCurrentVideoSettings() {
	const instance = app.cores.mediartc.instance()
	const stream = instance.self.screenStream

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
	const { resolutionsList, frameratesList } = React.useMemo(
		() => app.cores.mediartc.vars(),
		[],
	)
	const currentTrackSettings = getCurrentVideoSettings()

	const stopScreenShare = () => {
		const handlers = app.cores.mediartc.handlers()

		handlers.stopScreenShare()

		if (typeof close === "function") {
			close()
		}
	}

	const changeVideoStreamConstraints = (type, value) => {
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

	return (
		<div className="screenshare-dialog">
			<div className="screenshare-dialog__selectors">
				<div
					id="resolution"
					className="screenshare-dialog__selectors__field"
				>
					<div className="screenshare-dialog__selectors__field__icon">
						<Icons.Proportions />
						<span>Resolution</span>
					</div>

					<Select
						options={resolutionsList}
						value={currentTrackSettings.resolution}
						onChange={(value) =>
							changeVideoStreamConstraints("resolution", value)
						}
					/>
				</div>

				<div
					id="framerate"
					className="screenshare-dialog__selectors__field"
				>
					<div className="screenshare-dialog__selectors__field__icon">
						<Icons.Gauge />
						<span>Frame Rate</span>
					</div>

					<Select
						options={frameratesList}
						value={currentTrackSettings.frameRate}
						onChange={(value) =>
							changeVideoStreamConstraints("framerate", value)
						}
					/>
				</div>
			</div>

			<Button
				type="primary"
				onClick={stopScreenShare}
			>
				<Icons.CircleStop /> Stop Screenshare
			</Button>
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
