import React from "react"
import { Button } from "antd"
import classNames from "classnames"

import WaveformStream from "@components/WaveformStream"
import { Icons } from "@components/Icons"
import UserAvatar from "@components/UserAvatar"

import { openDialog as openScreenShareDialog } from "@components/ScreenShareDialog"
import { openDialog as openScreenShareOptionsDialog } from "@components/ScreenShareOptionsDialog"
import { openDialog as openSoundpadDialog } from "@components/SoundpadDialog"

import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const MediaRTCChannelCard = () => {
	const state = useMediaRTCState()

	const handleGoToChannel = () => {
		app.location.push(`/groups/channel`)
	}

	const toggleScreenShare = async () => {
		if (state.isProducingScreen) {
			openScreenShareOptionsDialog()
		} else {
			openScreenShareDialog()
		}
	}

	const handleLeaveChannel = () => {
		const handlers = app.cores.mediartc.handlers()

		handlers.leaveChannel()
	}

	const handleToggleMute = () => {
		const handlers = app.cores.mediartc.handlers()

		if (state.isMuted) {
			handlers.unmuteMicrophone()
		} else {
			handlers.muteMicrophone()
		}
	}

	const handleToggleDeafen = () => {
		const handlers = app.cores.mediartc.handlers()

		if (state.isDeafened) {
			handlers.undeafenAudio()
		} else {
			handlers.deafenAudio()
		}
	}

	const hasVideoProducers =
		app.cores.mediartc
			.instance()
			.producers.values()
			.some((consumer) => consumer.kind === "video") ||
		state.isProducingScreen

	const imSpeaking = state?.speakingClients[app.userData._id] ?? false

	return (
		<div className="mediartc-channel-card">
			{state.isProducingScreen && (
				<WaveformStream
					stream={app.cores.mediartc.instance().screenStream}
				/>
			)}
			<div className="mediartc-channel-card__header">
				<div className="mediartc-channel-card__header__info">
					<span
						className={classNames(
							"mediartc-channel-card__header__info__indicator",
							{
								["speaking"]: imSpeaking,
							},
						)}
					>
						<UserAvatar user_id={app.userData._id} />
					</span>

					<div className="mediartc-channel-card__header__info__titles">
						<h1 onClick={handleGoToChannel}>
							{state?.channel?.name}
						</h1>
						<p>{state?.channel?.description}</p>
					</div>
				</div>

				<div className="mediartc-channel-card__header__actions">
					<Button
						icon={<Icons.MdCallEnd />}
						onClick={handleLeaveChannel}
					/>
				</div>
			</div>

			<div className="mediartc-channel-card__clients">
				{state.clients.map((client) => {
					if (client.self) {
						return null
					}

					const isSpeaking =
						state?.speakingClients[client.userId] ?? false
					const isMuted = client.voiceState?.muted ?? false
					const isDeafened = client.voiceState?.deafened ?? false

					return (
						<div
							key={client.userId}
							className={classNames(
								"mediartc-channel-card__clients__client",
								{
									["speaking"]: isSpeaking,
									["muted"]: isMuted,
									["deafened"]: isDeafened,
								},
							)}
						>
							<div className="mediartc-channel-card__clients__client__indicators">
								{isMuted && <Icons.MdMicOff />}
								{isDeafened && <Icons.MdVolumeOff />}
							</div>
							<UserAvatar user_id={client.userId} />
						</div>
					)
				})}
			</div>

			<div className="mediartc-channel-card__controls">
				<Button
					icon={state.isMuted ? <Icons.MdMicOff /> : <Icons.MdMic />}
					onClick={handleToggleMute}
					type={state.isMuted ? "primary" : "default"}
					className={state.isSpeaking ? "speaking" : ""}
				/>

				<Button
					icon={
						state.isDeafened ? (
							<Icons.MdVolumeOff />
						) : (
							<Icons.MdVolumeUp />
						)
					}
					type={state.isDeafened ? "primary" : "default"}
					onClick={handleToggleDeafen}
				/>

				<Button
					icon={
						state.isProducingScreen ? (
							<Icons.MdStopScreenShare />
						) : (
							<Icons.MdScreenShare />
						)
					}
					type={state.isProducingScreen ? "primary" : "default"}
					onClick={toggleScreenShare}
				/>

				<Button
					icon={<Icons.MdVoiceChat />}
					onClick={() =>
						openSoundpadDialog({ group_id: state.channel.group_id })
					}
				/>
			</div>
		</div>
	)
}

export default MediaRTCChannelCard
