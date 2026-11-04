import React from "react"
import { Skeleton } from "antd"
import { Icons } from "@components/Icons"

import ChannelsListItem from "./item"

import { VALID_CHANNEL_KINDS } from "@comty/spaces-sdk/group/constants"
import {
	useGroupLoading,
	useGroupChannels,
	useGroupRTC,
	useGroupData,
	useGroupPermission,
} from "@comty/spaces-sdk/group"
import { rtcService, useRTCStore } from "@/rtc"

import { useSpacesNavigation } from "@/stores/spaces/navigation"

import "./index.less"

const ChannelsPanel = () => {
	const loading = useGroupLoading()
	const channels = useGroupChannels()
	const data = useGroupData()

	const nav = useSpacesNavigation()
	const state = useRTCStore()

	const canReadChannels = useGroupPermission("READ_CHANNELS")
	const canConnectVoice = useGroupPermission("VOICE_CONNECT")

	const isChannelLocked = React.useCallback(
		(channel) => {
			if (channel.kind === "voice") {
				// already connected clients can always open the channel view
				return !canConnectVoice && state.channel?._id !== channel._id
			}

			return !canReadChannels
		},
		[canReadChannels, canConnectVoice, state.channel?._id],
	)

	const handleOnClickChannel = React.useCallback(
		async (channel) => {
			if (!data) {
				return null
			}

			if (isChannelLocked(channel)) {
				return null
			}

			if (channel.kind === "voice") {
				if (state.channel?._id === channel._id && state.state === "connected") {
					nav.actions.navigate(
						{ channel: channel._id, subview: "voice" },
						{ replace: true },
					)
					return
				}

				await rtcService.handlers.joinChannel({
					groupId: data._id,
					channelId: channel._id,
				})

				// the handler swallows errors, only update the url when the
				// channel was actually joined
				if (rtcService.channel?._id === channel._id) {
					nav.actions.navigate(
						{ channel: channel._id, subview: "voice" },
						{ replace: true },
					)
				}

				return
			}

			if (channel.kind === "chat") {
				nav.actions.navigate({
					channel: channel._id,
					subview: null,
				})
				return
			}
		},
		[data, state, nav.actions, isChannelLocked],
	)

	return (
		<div className="group-page__channels-panel">
			<div className="group-page__channels-panel__header">
				<h3>
					<Icons.StretchHorizontal /> Channels
				</h3>
			</div>

			<div className="group-page__channels-panel__list">
				{loading && <Skeleton />}

				{!loading &&
					channels &&
					channels.items.map((channel) => {
						return (
							<ChannelsListItem
								key={channel._id}
								channel={channel}
								selected={nav.channel === channel._id}
								handleOnClick={() => handleOnClickChannel(channel)}
								invalid={!VALID_CHANNEL_KINDS.includes(channel.kind)}
								locked={isChannelLocked(channel)}
							/>
						)
					})}
			</div>
		</div>
	)
}

export default ChannelsPanel
