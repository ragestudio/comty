import classnames from "classnames"
import { AnimatePresence } from "motion/react"

import VoiceClient from "@components/Spaces/VoiceClient"
import useMediaRTCState from "@hooks/useMediaRTCState"

import { Icons } from "@components/Icons"

import "./index.less"

const ChannelsListItem = ({ channel, invalid, selected, handleOnClick }) => {
	if (!channel) {
		return null
	}

	const rtcState = useMediaRTCState()
	const isJoined = rtcState.channelId === channel._id

	const getRtcClient = React.useCallback(
		(client) => {
			if (!isJoined || !client) {
				return null
			}

			return app.cores.mediartc.instance().clients.get(client.userId)
		},
		[isJoined, rtcState],
	)

	const isClientSpeaking = React.useCallback(
		(client) => {
			const rtcClient = getRtcClient(client)

			if (!rtcClient) {
				return null
			}

			if (rtcClient.self) {
				return rtcState.isSpeaking
			}

			return rtcClient.micConsumer?.isSpeaking
		},
		[isJoined, rtcState],
	)

	const getClientProducers = React.useCallback(
		(client) => {
			const rtcClient = getRtcClient(client)

			if (!rtcClient) {
				return [...channel.producers].filter(
					(producer) => producer.user_id === client.userId,
				)
			}

			return rtcClient.getAvailableProducers()
		},
		[isJoined, rtcState],
	)

	return (
		<div
			className={classnames(
				"group-page__channels-panel__list-item bg-accent",
				{
					["invalid"]: invalid,
					["selected"]: selected,
					["joined"]: isJoined,
					["empty"]: channel?.clients?.length === 0,
				},
			)}
		>
			<div
				className="group-page__channels-panel__list-item__content "
				onClick={handleOnClick}
			>
				<div className="group-page__channels-panel__list-item__content__icon">
					{channel.kind === "voice" && <Icons.Volume2 />}
					{channel.kind === "chat" && <Icons.MessageSquare />}
				</div>

				<div className="group-page__channels-panel__list-item__content__info">
					<div className="group-page__channels-panel__list-item__content__info__name">
						<p>{channel.name}</p>
					</div>

					{channel.description && (
						<div className="group-page__channels-panel__list-item__content__info__description">
							<span>{channel.description}</span>
						</div>
					)}
				</div>
			</div>

			<AnimatePresence mode="sync">
				{channel?.clients?.length !== 0 && (
					<div
						key={`clients-list-${channel._id}`}
						className="group-page__channels-panel__list-item__clients bg-accent"
						data-channel-id={channel._id}
						data-group-id={channel.group_id}
					>
						{channel?.clients.map((client, index) => {
							return (
								<VoiceClient
									key={index}
									client={client}
									speaking={isClientSpeaking(client)}
									producers={getClientProducers(client)}
								/>
							)
						})}
					</div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default ChannelsListItem
