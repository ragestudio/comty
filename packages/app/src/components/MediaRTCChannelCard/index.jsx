import React from "react"
import { Button, Tooltip, Slider } from "antd"
import classNames from "classnames"
import VoiceDetector from "@cores/mediartc/classes/VoiceDetector"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import UserAvatar from "@components/UserAvatar"

import copyToClipboard from "@utils/copyToClipboard"

import GroupsModel from "@models/groups"

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

const ClientContextMenu = ({ client, close }) => {
	const state = useMediaRTCState()

	const clientInstance = React.useMemo(() => {
		return app.cores.mediartc.instance().clients.get(client.userId)
	}, [client])

	const onClickCopyUserId = React.useCallback(() => {
		copyToClipboard(client.userId)
		close()
	}, [client])

	const onClickDirectMessage = React.useCallback(() => {
		app.navigation.goToDirectMessage(client.userId)
		close()
	}, [client])

	const onClickGoModerate = React.useCallback(() => {
		close()
	}, [client])

	const onClickDisconnect = React.useCallback(async () => {
		await GroupsModel.channels.channel.disconnectUser(
			state.channel.group_id,
			state.channel._id,
			client.userId,
		)

		close()
	}, [client])

	const onClickToggleMute = React.useCallback(() => {
		console.debug("Toggle mute", client.userId)

		clientInstance.toggleMute()
	}, [client])

	const onChangeVolume = React.useCallback(
		(value) => {
			console.debug(
				`Changing volume to client ${client.userId} to`,
				value,
			)

			clientInstance.setVolume(value)
		},
		[client],
	)

	return (
		<>
			<UserPreview user_id={client.userId} />

			<div className="context-menu-separator" />

			{!client.self && (
				<div className="item no_effect">
					<div className="item__line">
						<p className="item__line__label">Volume</p>

						<div className="item__line__icon">
							<Icons.Volume2 />
						</div>
					</div>

					<Slider
						min={0}
						max={150}
						defaultValue={clientInstance.localState.volume * 100}
						onChangeComplete={onChangeVolume}
					/>
				</div>
			)}

			{!client.self && (
				<div
					className="item"
					onClick={onClickDirectMessage}
				>
					<div className="item__line">
						<p className="item__line__label">Direct Message</p>

						<div className="item__line__icon">
							<Icons.MessageCircle />
						</div>
					</div>
				</div>
			)}

			<div
				className="item disabled"
				onClick={onClickGoModerate}
			>
				<div className="item__line">
					<p className="item__line__label">Moderate</p>

					<div className="item__line__icon">
						<Icons.RectangleEllipsis />
					</div>
				</div>
			</div>

			<div
				className="item"
				onClick={onClickCopyUserId}
			>
				<div className="item__line">
					<p className="item__line__label">Copy User ID</p>

					<div className="item__line__icon">
						<Icons.Copy />
					</div>
				</div>
			</div>

			<div className="context-menu-separator" />

			{!client.self && (
				<div
					className="item"
					onClick={onClickToggleMute}
				>
					<div className="item__line">
						<p className="item__line__label">
							{clientInstance.localState.muted
								? "Unmute"
								: "Mute"}
						</p>

						<div className="item__line__icon">
							{clientInstance.localState.muted ? (
								<Icons.MicOff />
							) : (
								<Icons.Mic />
							)}
						</div>
					</div>
				</div>
			)}

			<div
				className="item danger"
				onClick={onClickDisconnect}
			>
				<div className="item__line">
					<p className="item__line__label">Disconnect</p>

					<div className="item__line__icon">
						<Icons.CircleMinus />
					</div>
				</div>
			</div>
		</>
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
					client: client,
					close: app.cores.ctx_menu.close,
				}),
				x,
				y,
			)
		},
		[client],
	)

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
		<div
			key={client.userId}
			className={classNames("mediartc-channel-card__clients__client", {
				["speaking"]: speaking,
				["muted"]: muted,
				["deafened"]: deafened,
				["failed"]: !consumer,
			})}
			onContextMenu={onContextMenu}
		>
			<div className="mediartc-channel-card__clients__client__indicators">
				{muted && <Icons.MicOff />}
				{deafened && <Icons.VolumeOff />}
				{!consumer && <Icons.WifiOff />}
			</div>

			<UserAvatar user_id={client.userId} />
		</div>
	)
}

const MediaRTCChannelCard = () => {
	const state = useMediaRTCState()

	const handleGoToChannel = () => {
		app.location.push(`/spaces/channel`)
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
						icon={<Icons.PhoneOff />}
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

				<ConnectionStateIndicator
					send={state.sendTransportState}
					recv={state.recvTransportState}
				/>
			</div>
		</div>
	)
}

export default MediaRTCChannelCard
