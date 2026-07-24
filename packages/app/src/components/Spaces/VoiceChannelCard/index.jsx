import React from "react"
import { Button } from "antd"
import classNames from "classnames"

import Popover from "@ui/Popover"
import TimeAgo from "@components/TimeAgo"
import { Icons } from "@components/Icons"
import ClientContextMenu from "@components/Spaces/VoiceClient/menu-context"

import { openDialog as openScreenShareDialog } from "@components/ScreenShareDialog"
import { openDialog as openScreenShareOptionsDialog } from "@components/ScreenShareOptionsDialog"
import { openDialog as openSoundpadDialog } from "@components/SoundpadDialog"
import { openDialog as openShareCameraDialog } from "@components/ShareCameraDialog"

import useMediaRTCState from "@hooks/useMediaRTCState"

import VoiceChannelStats from "./stats"

import "./index.less"

const stateToText = {
	failed: "Failed",
	closed: "Closed",
	connecting: "Connecting",
	connected: "Connected",
}

const ConnectionStateIndicator = ({ state }) => {
	return (
		<div
			className={classNames("connection-indicator", {
				loading: state.isLoading,
				connected: state.sendTransportState === "connected",
			})}
		>
			<Popover
				trigger="click"
				position="top"
				content={() => <VoiceChannelStats state={state} />}
				autoAdjust={true}
			>
				{state.isLoading && <Icons.LoadingOutlined />}
				{!state.isLoading && <Icons.Connection />}

				{state.isLoading && "Connecting..."}
				{!state.isLoading &&
					(stateToText[state.sendTransportState] ??
						state.sendTransportState)}
			</Popover>
		</div>
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

			const contextMenuProps = {
				target: event.target,
				client: { ...client, self: true },
				close: app.cores.ctx_menu.close,
			}

			app.cores.ctx_menu.renderMenu(
				React.createElement(ClientContextMenu, contextMenuProps),
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
					client={{
						userId: app.userData._id,
					}}
				/>

				<div className="rtc-vc-card__header__titles">
					<div className="rtc-vc-card__header__titles__indicators">
						<ConnectionStateIndicator
							state={state}
							loading={state.isLoading}
							send={state.sendTransportState}
							recv={state.recvTransportState}
						/>

						{state?.connectedAt && (
							<>
								<div className="divider" />
								<span className="rtc-vc-card__header__titles__indicators__timer">
									<TimeAgo
										time={state?.connectedAt.toISOString()}
										counterMode
									/>
								</span>
							</>
						)}
					</div>

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
