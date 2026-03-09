import React from "react"
import { Slider } from "antd"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import copyToClipboard from "@utils/copyToClipboard"

import GroupsModel from "@models/groups"

import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const ClientContextMenu = ({ target, client, close }) => {
	const state = useMediaRTCState()
	const group_id =
		target.parentElement.closest("[data-group-id]").dataset.groupId
	const channel_id =
		target.parentElement.closest("[data-channel-id]").dataset.channelId

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
			state.channel?.group_id ?? group_id,
			state.channel?._id ?? channel_id,
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
						defaultValue={
							(clientInstance?.localState?.volume ?? 1) * 100
						}
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
							{clientInstance?.localState?.muted
								? "Unmute"
								: "Mute"}
						</p>

						<div className="item__line__icon">
							{clientInstance?.localState?.muted ? (
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

export default ClientContextMenu
