import React from "react"
import { Button } from "antd"
import classNames from "classnames"

import { Icons } from "@components/Icons"
import ClientContextMenu from "@components/Spaces/VoiceClient/menu-context"

import { openDialog as openScreenShareDialog } from "@components/ScreenShareDialog"
import { openDialog as openScreenShareOptionsDialog } from "@components/ScreenShareOptionsDialog"
import { openDialog as openSoundpadDialog } from "@components/SoundpadDialog"
import { openDialog as openShareCameraDialog } from "@components/ShareCameraDialog"

import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const stateToText = {
	failed: "Failed",
	closed: "Closed",
	connecting: "Connecting",
	connected: "Connected",
}

const ConnectionStateIndicator = ({ recv, send }) => {
	return (
		<p className={classNames("connection-indicator", send)}>
			<Icons.Connection />
			{stateToText[send] ?? send}
		</p>
	)
}

const Self = ({ client, speaking }) => {
	const onContextMenu = React.useCallback(
		(event) => {
			event.preventDefault()
			event.stopPropagation()

			const { x, y } = app.cores.ctx_menu.calculateFitCordinates(
				event,
				parseInt(
					app.cores.style.vars["context-menu-width"].replace(
						"px",
						"",
					),
				),
				300, // FIXME: calculate height properly
			)

			app.cores.ctx_menu.renderMenu(
				React.createElement(ClientContextMenu, {
					client: { ...client, self: true },
					close: app.cores.ctx_menu.close,
				}),
				x,
				y,
			)
		},
		[client],
	)

	return (
		<div
			key={app.userData._id}
			className={classNames("rtc-vc-card__self", {
				["speaking"]: speaking ?? false,
			})}
			onContextMenu={onContextMenu}
		>
			<img src={app.userData.avatar} />
		</div>
	)
}

const VoiceChannelCard = () => {
	const state = useMediaRTCState()

	const handleGoToChannel = () => {
		app.location.push(
			`/spaces/group/${state.channel.group_id}/${state.channel._id}/voice`,
		)
	}

	const toggleScreenShare = async () => {
		if (state.isProducingScreen) {
			openScreenShareOptionsDialog()
		} else {
			openScreenShareDialog()
		}
	}

	const handleToggleCamera = () => {
		if (state.isProducingCamera) {
			app.cores.mediartc.handlers().stopCameraShare()
		} else {
			openShareCameraDialog()
		}
	}

	const handleLeaveChannel = () => {
		return app.cores.mediartc.handlers().leaveChannel()
	}

	const handleToggleMute = () => {
		return app.cores.mediartc.handlers().toggleMute()
	}

	const handleToggleDeafen = () => {
		return app.cores.mediartc.handlers().toggleDeafen()
	}

	return (
		<div className="rtc-vc-card">
			<div className="rtc-vc-card__header">
				<Self
					speaking={state.isSpeaking}
					sendTransportState={state.sendTransportState}
					recvTransportState={state.recvTransportState}
					client={{
						userId: app.userData._id,
					}}
				/>

				<div className="rtc-vc-card__header__titles">
					<ConnectionStateIndicator
						send={state.sendTransportState}
						recv={state.recvTransportState}
					/>
					<h1 onClick={handleGoToChannel}>
						<Icons.ExternalLink /> {state?.channel?.name}
					</h1>
				</div>

				<div className="rtc-vc-card__header__actions">
					<Button
						icon={<Icons.PhoneOff />}
						onClick={handleLeaveChannel}
					/>
				</div>
			</div>

			<div className="rtc-vc-card__controls">
				<Button
					icon={state.isMuted ? <Icons.MicOff /> : <Icons.Mic />}
					onClick={handleToggleMute}
					type={state.isMuted ? "primary" : "default"}
					className={state.isSpeaking ? "speaking" : ""}
				/>

				<Button
					icon={
						state.isDeafened ? (
							<Icons.VolumeOff />
						) : (
							<Icons.Volume2 />
						)
					}
					type={state.isDeafened ? "primary" : "default"}
					onClick={handleToggleDeafen}
				/>

				<Button
					disabled
					icon={
						state.isProducingCamera ? (
							<Icons.CameraOff />
						) : (
							<Icons.Camera />
						)
					}
					type={state.isProducingCamera ? "primary" : "default"}
					onClick={handleToggleCamera}
				/>

				<Button
					icon={
						state.isProducingScreen ? (
							<Icons.ScreenShareOff />
						) : (
							<Icons.ScreenShare />
						)
					}
					type={state.isProducingScreen ? "primary" : "default"}
					onClick={toggleScreenShare}
				/>

				<Button
					icon={<Icons.Drum />}
					onClick={() =>
						openSoundpadDialog({ group_id: state.channel.group_id })
					}
				/>
			</div>
		</div>
	)
}

export default VoiceChannelCard
