import React from "react"
import Button from "@ui/Button"
import { Select, Switch } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

function retreiveAvailableVideoCodecs() {
	const core = app.cores.mediartc.instance()

	if (!core.device) {
		return []
	}

	if (!core.device.sendRtpCapabilities) {
		return []
	}

	return core.device.sendRtpCapabilities.codecs.filter(
		(cap) => cap.kind === "video",
	)
}

const excludedCodecs = ["rtx"]

const ScreenShareDialog = ({ close }) => {
	const { resolutionsList, frameratesList, contentHintsList } = React.useMemo(
		() => app.cores.mediartc.vars(),
		[],
	)
	const [resolution, setResolution] = React.useState(resolutionsList[1].value)
	const [framerate, setFramerate] = React.useState(frameratesList[2].value)
	const [systemAudio, setSystemAudio] = React.useState(!!app.isDesktop)
	const [contentHint, setContentHint] = React.useState(
		contentHintsList[0].value,
	)
	const [preferredCodec, setPreferredCodec] = React.useState("auto")

	const availableVideoCodecs = React.useMemo(() => {
		let codecs = new Set([
			{
				label: "Auto Select",
				value: "auto",
				data: {},
			},
		])

		for (const codec of retreiveAvailableVideoCodecs()) {
			const mime = codec.mimeType.split("/")

			if (excludedCodecs.includes(mime[1])) {
				continue
			}

			codecs.add({
				label: mime[1].toUpperCase(),
				value: mime[1],
				data: codec,
			})
		}

		return Array.from(codecs).sort((a, b) => a.label.localeCompare(b.label))
	}, [])

	const startScreenShare = React.useCallback(async () => {
		const [width, height] = resolution.split("x").map(Number)

		const options = {
			resolution: {
				height: height,
				width: width,
			},
			framerate: framerate,
			systemAudio: systemAudio,
			preferredCodec: preferredCodec,
			contentHint: contentHint,
		}

		try {
			app.cores.mediartc.handlers().startScreenShare(options)
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
								options={resolutionsList}
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
								options={frameratesList}
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
								options={contentHintsList}
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
									Not supported in browsers, use desktop
									application instead.
								</span>
							)}
						</div>
					</div>

					<div className="screenshare-dialog__selectors__field__content">
						<Switch
							disabled={!app.isDesktop}
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
