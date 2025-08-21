import React from "react"
import { Button, Tooltip } from "antd"
import classNames from "classnames"
import VoiceDetector from "@cores/mediartc/classes/VoiceDetector"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import UserAvatar from "@components/UserAvatar"

import { openDialog as openScreenShareDialog } from "@components/ScreenShareDialog"
import { openDialog as openScreenShareOptionsDialog } from "@components/ScreenShareOptionsDialog"
import { openDialog as openSoundpadDialog } from "@components/SoundpadDialog"

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

const ClientTooltip = ({ client }) => {
	return (
		<UserPreview
			user_id={client.userId}
			small
		/>
	)
}

const Client = ({ client }) => {
	const muted = client.voiceState.muted
	const deafened = client.voiceState.deafened
	const [speaking, setSpeaking] = React.useState(false)
	const voiceDetector = React.useRef(null)

	const consumer = React.useMemo(() => {
		if (client.self) {
			return app.cores.mediartc.instance().self.micProducer
		} else {
			return app.cores.mediartc
				.instance()
				.consumers.get(client.micConsumerId)
		}
	}, [
		client.self
			? app.cores.mediartc.instance().self.micProducer
			: client.micConsumerId,
	])

	// attach voice detector
	React.useEffect(() => {
		if (consumer) {
			console.debug("attaching voice detector", consumer.track)
			voiceDetector.current = new VoiceDetector({
				threshold: 0.1,
				minSpeakingTime: 50,
				minSilenceTime: 500,
			})

			voiceDetector.current.onSpeaking(
				() => {
					setSpeaking(true)
				},
				() => {
					setSpeaking(false)
				},
			)

			voiceDetector.current.initialize(new MediaStream([consumer.track]))
		}

		return () => {
			if (voiceDetector.current) {
				console.debug("destroying voice detector", consumer.track)
				voiceDetector.current.destroy()
				voiceDetector.current = null
			}
		}
	}, [consumer])

	return (
		<Tooltip title={<ClientTooltip client={client} />}>
			<div
				key={client.userId}
				className={classNames(
					"mediartc-channel-card__clients__client",
					{
						["speaking"]: speaking,
						["muted"]: muted,
						["deafened"]: deafened,
						["failed"]: !consumer,
					},
				)}
			>
				<div className="mediartc-channel-card__clients__client__indicators">
					{muted && <Icons.MdMicOff />}
					{deafened && <Icons.MdVolumeOff />}
					{!consumer && <Icons.MdWifiTetheringError />}
				</div>

				<UserAvatar user_id={client.userId} />
			</div>
		</Tooltip>
	)
}

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
		return app.cores.mediartc.handlers().leaveChannel()
	}

	const handleToggleMute = () => {
		return app.cores.mediartc.handlers().toggleMute()
	}

	const handleToggleDeafen = () => {
		return app.cores.mediartc.handlers().toggleDeafen()
	}

	return (
		<div className="mediartc-channel-card">
			<div className="mediartc-channel-card__header">
				<div className="mediartc-channel-card__header__info">
					<Client
						client={{
							self: true,
							userId: app.userData._id,
							sendTransportState: state.sendTransportState,
							recvTransportState: state.recvTransportState,
							voiceState: {
								muted: state.isMuted,
								deafened: state.isDeafened,
							},
						}}
					/>

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

					return (
						<Client
							key={client.userId}
							client={client}
						/>
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

				<ConnectionStateIndicator
					send={state.sendTransportState}
					recv={state.recvTransportState}
				/>
			</div>
		</div>
	)
}

export default MediaRTCChannelCard
