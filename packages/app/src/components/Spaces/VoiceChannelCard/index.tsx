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

import { type RTCReactiveState, useRTCStore, rtcService } from "@/rtc"

import VoiceChannelStats from "./stats"

import "./index.less"

const stateToText = {
	failed: "Failed",
	closed: "Closed",
	connecting: "Connecting",
	connected: "Connected",
}

const ConnectionStateIndicator = ({ state }: { state: RTCReactiveState }) => {
	const isLoading = state.state === "loading"

	return (
		<div
			className={classNames("connection-indicator", {
				loading: isLoading,
				connected: state.sendTransportState === "connected",
			})}
		>
			<Popover
				trigger="click"
				position="top"
				content={() => <VoiceChannelStats state={state} />}
				autoAdjust={true}
			>
				{isLoading && <Icons.LoadingOutlined />}
				{!isLoading && <Icons.Connection />}

				{isLoading && "Connecting..."}
				{!isLoading &&
					(stateToText[state.sendTransportState] ?? state.sendTransportState)}
			</Popover>
		</div>
	)
}

const VoiceChannelCard = () => {
	const state = useRTCStore()

	const isScreensharing =
		state.screenVideoProducerId || state.screenAudioProducerId
	const isMuted = state.voiceState.muted
	const isDeafened = state.voiceState.deafened

	const handleGoToChannel = () => {
		app.location.push(
			`/spaces/group/${state.channel.group_id}/${state.channel._id}/voice`,
		)
	}

	const toggleScreenShare = async () => {
		if (isScreensharing) {
			openScreenShareOptionsDialog()
		} else {
			openScreenShareDialog()
		}
	}

	const handleLeaveChannel = () => {
		return rtcService.handlers.leaveChannel()
	}

	const handleToggleMute = () => {
		return rtcService.self.toggleMute()
	}

	const handleToggleDeafen = () => {
		return rtcService.self.toggleDeafened()
	}

	return (
		<div className="rtc-vc-card">
			<div className="rtc-vc-card__header">
				<div className="rtc-vc-card__header__titles">
					<div className="rtc-vc-card__header__titles__indicators">
						<ConnectionStateIndicator state={state} />

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
					icon={isMuted ? <Icons.MicOff /> : <Icons.Mic />}
					onClick={handleToggleMute}
					type={isMuted ? "primary" : "default"}
					className={classNames("mic-button", {
						speaking: state.isSpeaking,
					})}
				/>

				<Button
					icon={isDeafened ? <Icons.VolumeOff /> : <Icons.Volume2 />}
					type={isDeafened ? "primary" : "default"}
					onClick={handleToggleDeafen}
				/>

				<Button
					icon={
						state.screenVideoProducerId || state.screenAudioProducerId ? (
							<Icons.ScreenShareOff />
						) : (
							<Icons.ScreenShare />
						)
					}
					type={isScreensharing ? "primary" : "default"}
					onClick={toggleScreenShare}
				/>

				<Button
					icon={<Icons.Drum />}
					onClick={() =>
						openSoundpadDialog({ group_id: state.channel.group_id })
					}
				/>

				<Button
					icon={<Icons.Settings />}
					onClick={() => app.controls.openSettings("voice")}
				/>
			</div>
		</div>
	)
}

export default VoiceChannelCard
