import type { Channel } from "@comty/shared/types/spaces/channel"
import type { MouseEventHandler } from "react"
import type { Client } from "@comty/shared/types/rtc/client"

import React from "react"
import classnames from "classnames"
import { AnimatePresence } from "motion/react"

import TimeAgo from "@components/TimeAgo"
import VoiceClient from "@components/Spaces/VoiceClient"
import { Icons } from "@components/Icons"

import { useRTCStore } from "@/rtc"
import { GroupStore } from "@/group"

import "./index.less"

const ChannelsListItem = ({
	channel,
	invalid,
	selected,
	handleOnClick,
	hasUnread = false,
}: {
	channel: Channel
	invalid?: boolean
	selected?: boolean
	hasUnread?: boolean
	handleOnClick?: MouseEventHandler
}) => {
	if (!channel) {
		return null
	}

	const channelState = GroupStore((s) => s.statedChannels[channel._id])
	const rtcState = useRTCStore()

	const isJoined = rtcState.channel?._id === channel._id

	// only return true if the client is speaking and is joined to the channel
	const isClientSpeaking = React.useCallback(
		(client: Client) => {
			if (!isJoined) return null
			if (client.self) return rtcState.isSpeaking

			return rtcState.speakingClients.includes(client.userId)
		},
		[isJoined, rtcState],
	)

	const getClientProducers = React.useCallback(
		(client: Client) => {
			if (!channelState || !Array.isArray(channelState.producers)) {
				return []
			}

			return channelState.producers.filter(
				(producer) => producer.userId === client.userId,
			)
		},
		[channelState],
	)

	return (
		<div
			className={classnames("group-page__channels-panel__list-item bg-accent", {
				["invalid"]: invalid,
				["selected"]: selected,
				["joined"]: isJoined,
				["empty"]: channelState?.clients?.length === 0,
				["has-unread"]: hasUnread,
			})}
		>
			<div
				className="group-page__channels-panel__list-item__content"
				onClick={handleOnClick}
			>
				<div className="group-page__channels-panel__list-item__content__icon">
					{channel.kind === "voice" && <Icons.Volume2 />}
					{channel.kind === "chat" && <Icons.MessageSquare />}
				</div>

				<div className="group-page__channels-panel__list-item__content__info">
					<div
						className="group-page__channels-panel__list-item__content__info__name"
						style={{ display: "flex", alignItems: "center" }}
					>
						{hasUnread && (
							<span className="group-page__channels-panel__list-item__content__unread-badge" />
						)}

						<p>{channel.name}</p>
					</div>

					{channel.description && channel.kind !== "voice" && (
						<div className="group-page__channels-panel__list-item__content__info__description">
							<span>{channel.description}</span>
						</div>
					)}

					{channelState?.started_at && (
						<div className="group-page__channels-panel__list-item__content__info__timer">
							<TimeAgo
								time={channelState?.started_at}
								counterMode={true}
							/>
						</div>
					)}
				</div>
			</div>

			<AnimatePresence mode="sync">
				{(channelState?.clients?.length ?? 0) !== 0 && (
					<div
						key={`clients-list-${channel._id}`}
						className="group-page__channels-panel__list-item__clients bg-accent"
						data-channel-id={channel._id}
						data-group-id={channel.group_id}
					>
						{channelState?.clients?.map((client, index) => {
							return (
								<VoiceClient
									key={client.userId}
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
