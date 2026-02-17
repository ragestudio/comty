import React from "react"
import { Select, Button } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

const ScreenShareDialog = ({ close }) => {
	const { resolutionsList, frameratesList } = app.cores.mediartc.vars()

	const [resolution, setResolution] = React.useState(resolutionsList[0].value)
	const [framerate, setFramerate] = React.useState(frameratesList[2].value)

	const startScreenShare = async () => {
		const [width, height] = resolution.split("x").map(Number)

		const options = {
			resolution: {
				height,
				width,
			},
			framerate: framerate,
		}

		console.log("startScreenShare", options)

		try {
			app.cores.mediartc.handlers().startScreenShare(options)
		} catch (error) {
			console.error("Error starting screen share", error)
		}

		if (typeof close === "function") {
			close()
		}
	}

	return (
		<div className="screenshare-dialog">
			<div className="screenshare-dialog__header">
				<h1>Screen Share</h1>
				<p>Select your screen resolution and framerate</p>
			</div>

			<div className="screenshare-dialog__selectors">
				<div
					id="resolution"
					className="screenshare-dialog__selectors__field"
				>
					<div className="screenshare-dialog__selectors__field__icon">
						<Icons.Proportions />
					</div>

					<Select
						options={resolutionsList}
						value={resolution}
						onChange={setResolution}
					/>
				</div>

				<div
					id="framerate"
					className="screenshare-dialog__selectors__field"
				>
					<div className="screenshare-dialog__selectors__field__icon">
						<Icons.Gauge />
					</div>

					<Select
						options={frameratesList}
						value={framerate}
						onChange={setFramerate}
					/>
				</div>
			</div>

			<div className="screenshare-dialog__actions">
				<Button onClick={close}>Hell na</Button>
				<Button
					type="primary"
					onClick={startScreenShare}
				>
					Start
				</Button>
			</div>
		</div>
	)
}

export function openDialog() {
	app.layout.modal.open("screen-share-dialog", ScreenShareDialog)
}

export default ScreenShareDialog
