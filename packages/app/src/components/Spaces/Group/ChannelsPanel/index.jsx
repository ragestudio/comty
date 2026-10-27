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
} from "@comty/spaces-sdk/group"
import { rtcService, useRTCStore } from "@/rtc"

import { useSpacesNavigation } from "@/stores/spaces/navigation"

import "./index.less"

const ChannelsPanel = () => {
	const loading = useGroupLoading()
	const channels = useGroupChannels()
	const statedChannels = useGroupRTC()
	const data = useGroupData()

	const nav = useSpacesNavigation()
	const state = useRTCStore()

	const handleOnClickChannel = React.useCallback(
		(channel) => {
			if (!data) {
				return null
			}

			if (channel.kind === "voice") {
				if (state.channel?._id === channel._id) {
					nav.actions.navigate({
						channel: state.channel?._id,
						subview: "voice",
					})
					return
				}

				return rtcService.handlers.joinChannel({
					groupId: data._id,
					channelId: channel._id,
				})
			}

			if (channel.kind === "chat") {
				nav.actions.navigate({
					channel: channel._id,
					subview: null,
				})
			}
		},
		[data],
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
								handleOnClick={() =>
									handleOnClickChannel(channel)
								}
								invalid={
									!VALID_CHANNEL_KINDS.includes(channel.kind)
								}
							/>
						)
					})}
			</div>
		</div>
	)
}

export default ChannelsPanel
