import React from "react"
import { Skeleton } from "antd"
import { Icons } from "@components/Icons"

import ChannelsListItem from "./item"

import { GroupContext, VALID_CHANNEL_KINDS } from "@contexts/WithSpaces/group"
import SpacesPageContext from "@contexts/WithSpaces/page"
import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const ChannelsPanel = () => {
	const group = React.useContext(GroupContext)
	const page = React.useContext(SpacesPageContext)

	const handleOnClickChannel = React.useCallback(
		(channel) => {
			if (!group || !group.data) {
				return null
			}

			if (channel.kind === "voice") {
				if (app.cores.mediartc.state().channelId === channel._id) {
					page.setChannel(channel._id)
					page.setIsVoice(true)
					return
				}

				return app.cores.mediartc
					.handlers()
					.joinChannel(group.data._id, channel._id)
			}

			if (channel.kind === "chat") {
				page.setChannel(channel._id)
				page.setIsVoice(false)
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
					group?.channels.map((channel) => (
						<ChannelsListItem
							key={channel._id}
							channel={channel}
							selected={page.channel === channel._id}
							handleOnClick={() => handleOnClickChannel(channel)}
							invalid={
								!VALID_CHANNEL_KINDS.includes(channel.kind)
							}
						/>
					))}
			</div>
		</div>
	)
}

export default ChannelsPanel
