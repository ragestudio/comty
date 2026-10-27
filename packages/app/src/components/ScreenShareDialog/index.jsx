import React from "react"
import Button from "@ui/Button"
import { Select, Switch } from "antd"
import { Icons } from "@components/Icons"

import {
	SCREEN_CONTENT_HINTS,
	SCREEN_FRAMERATES,
	SCREEN_RESOLUTIONS,
} from "@comty/spaces-sdk/rtc/self/constants.js"

import { rtcService } from "@comty/spaces-sdk/rtc"

import "./index.less"

function retrieveAvailableVideoCodecs() {
	const codecs = rtcService.device?.sendRtpCapabilities?.codecs ?? []

	return codecs.filter((codec) => codec.kind === "video")
}

const excludedCodecs = ["rtx"]

const ScreenShareDialog = ({ close }) => {
	const [resolution, setResolution] = React.useState(
		SCREEN_RESOLUTIONS[1].value,
	)
	const [framerate, setFramerate] = React.useState(SCREEN_FRAMERATES[2].value)
	const [systemAudio, setSystemAudio] = React.useState(true)
	const [contentHint, setContentHint] = React.useState(
		SCREEN_CONTENT_HINTS[0].value,
	)
	const [preferredCodec, setPreferredCodec] = React.useState("auto")

	const availableVideoCodecs = React.useMemo(() => {
		let codecs = new Set([
			{
				label: "Auto Select",
				value: "auto",
			},
		])

		for (const codec of retrieveAvailableVideoCodecs()) {
			const mime = codec.mimeType.split("/")

			if (excludedCodecs.includes(mime[1])) {
				continue
			}

			codecs.add({
				label: mime[1].toUpperCase(),
				value: mime[1],
			})
		}

		return Array.from(codecs).sort((a, b) => a.label.localeCompare(b.label))
	}, [])

	const startScreenShare = React.useCallback(async () => {
		const [width, height] = resolution.split("x").map(Number)

		const codec =
			preferredCodec === "auto"
				? undefined
				: retrieveAvailableVideoCodecs().find(
						(item) => item.mimeType === `video/${preferredCodec}`,
					)

		try {
			await rtcService.self.createMedia("screen", {
				resolution: { width, height },
				framerate,
				systemAudio,
				contentHint,
				codec,
			})
		} catch (error) {
			console.error("Error starting screen share", error)
		}

		if (typeof close === "function") {
			close()
		}
	}, [resolution, contentHint, framerate, systemAudio, preferredCodec, close])

	return (
		<div className="screenshare-dialog">
			<div className="screenshare-dialog__header">
				<h1>Screen Share</h1>
				<p>Configure your parameters</p>
			</div>

			<div className="screenshare-dialog__selectors">
				<div className="screenshare-dialog__selectors__row">
					<div
						id="resolution"
						className="screenshare-dialog__selectors__field"
					>
						<div className="screenshare-dialog__selectors__field__icon">
							<Icons.Proportions />
							<span>Resolution</span>
						</div>

						<div className="screenshare-dialog__selectors__field__content">
							<Select
								options={SCREEN_RESOLUTIONS}
								value={resolution}
								onChange={setResolution}
							/>
						</div>
					</div>

					<div
						id="framerate"
						className="screenshare-dialog__selectors__field"
					>
						<div className="screenshare-dialog__selectors__field__icon">
							<Icons.Gauge />
							<span>Frame Rate</span>
						</div>

						<div className="screenshare-dialog__selectors__field__content">
							<Select
								options={SCREEN_FRAMERATES}
								value={framerate}
								onChange={setFramerate}
							/>
						</div>
					</div>
				</div>

				<div className="screenshare-dialog__selectors__row">
					<div
						id="contentHint"
						className="screenshare-dialog__selectors__field"
					>
						<div className="screenshare-dialog__selectors__field__icon">
							<Icons.Sparkles />
							<span>Content Hint</span>
						</div>

						<div className="screenshare-dialog__selectors__field__content">
							<Select
								options={SCREEN_CONTENT_HINTS}
								value={contentHint}
								onChange={setContentHint}
							/>
						</div>
					</div>

					<div
						id="video_codec"
						className="screenshare-dialog__selectors__field"
					>
						<div className="screenshare-dialog__selectors__field__icon">
							<Icons.Cpu />
							<span>Video Codec</span>
						</div>

						<div className="screenshare-dialog__selectors__field__content">
							<Select
								options={availableVideoCodecs}
								value={preferredCodec}
								onChange={setPreferredCodec}
							/>
						</div>
					</div>
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
									Browser support for tab or system audio may
									vary.
								</span>
							)}
						</div>
					</div>

					<div className="screenshare-dialog__selectors__field__content">
						<Switch
							checked={systemAudio}
							onChange={(value) => setSystemAudio(value)}
						/>
					</div>
				</div>
			</div>

			<div className="screenshare-dialog__actions">
				<Button onClick={close}>Cancel</Button>
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
	if (app.isMobile) {
		return app.layout.draggable.open(
			"screen-share-dialog",
			ScreenShareDialog,
		)
	}

	return app.layout.modal.open("screen-share-dialog", ScreenShareDialog)
}

export default ScreenShareDialog
