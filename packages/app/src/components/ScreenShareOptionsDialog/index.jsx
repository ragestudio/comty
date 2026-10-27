import Button from "@ui/Button"
import { Select } from "antd"
import { Icons } from "@components/Icons"

import {
	SCREEN_FRAMERATES,
	SCREEN_RESOLUTIONS,
} from "@comty/spaces-sdk/rtc/self/constants.js"

import { rtcService } from "@comty/spaces-sdk/rtc"

function getCurrentVideoSettings() {
	const stream = rtcService.self.screenStream

	if (!stream) {
		return null
	}

	const videoTracks = stream.getVideoTracks()

	if (videoTracks.length === 0) {
		return null
	}

	const [track] = videoTracks

	if (!track) {
		return null
	}

	const settings = track.getSettings()

	return {
		...settings,
		resolution: `${settings.width}x${settings.height}`,
	}
}

const ScreenShareOptionsDialog = ({ close }) => {
	const currentTrackSettings = getCurrentVideoSettings()

	const stopScreenShare = async () => {
		await rtcService.self.destroyMedia("screen")

		if (typeof close === "function") {
			close()
		}
	}

	const changeVideoStreamConstraints = (type, value) => {
		if (type === "resolution") {
			const [width, height] = value.split("x").map(Number)

			rtcService.self.updateScreenConstraints({ width, height })
		}

		if (type === "framerate") {
			rtcService.self.updateScreenConstraints({
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
						options={SCREEN_RESOLUTIONS}
						value={currentTrackSettings?.resolution}
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
						options={SCREEN_FRAMERATES}
						value={currentTrackSettings?.frameRate}
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
