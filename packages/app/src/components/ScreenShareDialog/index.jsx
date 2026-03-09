import React from "react"
import Button from "@ui/Button"
import { Select, Switch } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

const ScreenShareDialog = ({ close }) => {
	const { resolutionsList, frameratesList } = React.useMemo(
		() => app.cores.mediartc.vars(),
		[],
	)
	const [resolution, setResolution] = React.useState(resolutionsList[0].value)
	const [framerate, setFramerate] = React.useState(frameratesList[2].value)
	const [systemAudio, setSystemAudio] = React.useState(!!app.isDesktop)

	const startScreenShare = React.useCallback(async () => {
		const [width, height] = resolution.split("x").map(Number)

		const options = {
			resolution: {
				height: height,
				width: width,
			},
			framerate: framerate,
			systemAudio: systemAudio,
		}

		try {
			app.cores.mediartc.handlers().startScreenShare(options)
		} catch (error) {
			console.error("Error starting screen share", error)
		}

		if (typeof close === "function") {
			close()
		}
	}, [resolution, framerate, systemAudio, close])

	return (
		<div className="screenshare-dialog">
			<div className="screenshare-dialog__header">
				<h1>Screen Share</h1>
				<p>Configure your parameters</p>
			</div>

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
						<span>Frame Rate</span>
					</div>

					<Select
						options={frameratesList}
						value={framerate}
						onChange={setFramerate}
					/>
				</div>

				<div
					id="systemAudio"
					className="screenshare-dialog__selectors__field"
				>
					<div className="screenshare-dialog__selectors__field__icon">
						<Icons.Speaker />
						<div className="flex-column align-start gap-5">
							<span>System Audio</span>

							{!app.isDesktop && (
								<span style={{ fontSize: "0.8rem" }}>
									Not supported in browsers, use desktop
									application instead.
								</span>
							)}
						</div>
					</div>

					<Switch
						disabled={!app.isDesktop}
						checked={systemAudio}
						onChange={(value) => setSystemAudio(value)}
					/>
				</div>
			</div>

			<div className="screenshare-dialog__actions">
				<Button onClick={close}>Nevermind</Button>
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
