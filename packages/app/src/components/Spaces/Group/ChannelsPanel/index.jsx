import React from "react"
import { Skeleton } from "antd"
import { Icons } from "@components/Icons"

import ChannelsListItem from "./item"

import { GroupContext, VALID_CHANNEL_KINDS } from "@contexts/WithSpaces/group"
import { useSpacesNavigation } from "@contexts/WithSpaces/navigation"

import "./index.less"

const ChannelsPanel = () => {
	const group = React.useContext(GroupContext)
	const spaces = useSpacesNavigation()

	const handleOnClickChannel = React.useCallback(
		(channel) => {
			if (!group || !group.data) {
				return null
			}

			if (channel.kind === "voice") {
				if (app.cores.mediartc.state().channelId === channel._id) {
					spaces.navigate({
						channel: channel._id,
						subview: "voice",
					})
					return
				}

				return app.cores.mediartc
					.handlers()
					.joinChannel(group.data._id, channel._id)
			}

			if (channel.kind === "chat") {
				spaces.navigate({
					channel: channel._id,
					subview: null,
				})
			}
		},
		[group],
	)

	return (
		<div className="group-page__channels-panel">
			<div className="group-page__channels-panel__header">
				<h3>
					<Icons.StretchHorizontal /> Channels
				</h3>
			</div>

			<div className="group-page__channels-panel__list">
				{group?.loading && <Skeleton />}

				{!group?.loading &&
					group?.channels &&
					group?.channels.items.map((channel) => {
						const channelState =
							group?.statedChannels?.[channel._id]

						const clients = channelState?.clients || []
						const producers = channelState?.producers || []

						const startedAt = channelState?.started_at

						return (
							<ChannelsListItem
								key={channel._id}
								channel={channel}
								clients={clients}
								producers={producers}
								startedAt={startedAt}
								selected={spaces.channel === channel._id}
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
