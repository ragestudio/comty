import React from "react"
import { Button } from "antd"

import GroupsModel from "@models/groups"

import ChannelsListItem from "./item"
import {
	GroupContext as GroupPageContext,
	VALID_CHANNEL_KINDS,
} from "../../context"

import "./index.less"

const ChannelsPanel = () => {
	const ctx = React.useContext(GroupPageContext)

	const createChannel = async () => {
		const result = await GroupsModel.channels
			.create(ctx.group._id, {
				name: "New channel",
				description: "New channel description",
				kind: "media",
			})
			.catch((error) => {
				console.error(error)

				app.cores.notifications.new({
					type: "error",
					title: "Failed to create channel",
					description: error.message,
				})
				return null
			})

		if (result) {
			app.message.info("Channel created")
		}
	}

	const removeChannel = async () => {}

	const handleOnClickChannel = (channel) => {
		if (channel.kind === "voice") {
			if (app.cores.mediartc.state().channelId === channel._id) {
				return app.location.push(`/groups/channel`)
			}

			return app.cores.mediartc
				.handlers()
				.joinChannel(ctx.group._id, channel._id)
		}

		if (channel.kind === "chat") {
			ctx.setSelectedContentTab({
				type: "chat",
				props: { _id: channel._id },
			})
		}
	}

	return (
		<div className="group-page__channels-panel">
			<div className="group-page__channels-panel__header">
				<h3>Channels [{ctx.group.channels.length}]</h3>
			</div>

			<div className="group-page__channels-panel__list">
				{ctx.group.channels.map((channel) => (
					<ChannelsListItem
						key={channel._id}
						channel={channel}
						handleOnClick={() => handleOnClickChannel(channel)}
						invalid={!VALID_CHANNEL_KINDS.includes(channel.kind)}
						selected={
							ctx.selectedContentTab?.props?._id === channel._id
						}
					/>
				))}
			</div>
		</div>
	)
}

export default ChannelsPanel
