import React from "react"
import { Icons } from "@components/Icons"

import ChannelsListItem from "./item"

import { GroupContext, VALID_CHANNEL_KINDS } from "@pages/spaces/contexts/group"
import SpacesPageContext from "@pages/spaces/contexts/page"

import "./index.less"

const ChannelsPanel = () => {
	const group = React.useContext(GroupContext)
	const page = React.useContext(SpacesPageContext)

	const handleOnClickChannel = (channel) => {
		if (channel.kind === "voice") {
			if (app.cores.mediartc.state().channelId === channel._id) {
				return app.location.push(`/spaces/channel`)
			}

			return app.cores.mediartc
				.handlers()
				.joinChannel(group._id, channel._id)
		}

		if (channel.kind === "chat") {
			page.setChannel(channel._id)
		}
	}

	return (
		<div className="group-page__channels-panel">
			<div className="group-page__channels-panel__header">
				<h3>
					<Icons.StretchHorizontal /> Channels
				</h3>
			</div>

			<div className="group-page__channels-panel__list">
				{group.channels.map((channel) => (
					<ChannelsListItem
						key={channel._id}
						channel={channel}
						handleOnClick={() => handleOnClickChannel(channel)}
						invalid={!VALID_CHANNEL_KINDS.includes(channel.kind)}
						selected={page.channel === channel._id}
					/>
				))}
			</div>
		</div>
	)
}

export default ChannelsPanel
