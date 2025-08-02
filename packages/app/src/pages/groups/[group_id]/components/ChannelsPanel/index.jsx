import React from "react"
import { Button } from "antd"
import { motion, AnimatePresence } from "motion/react"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import UserAvatar from "@components/UserAvatar"

import GroupsModel from "@models/groups"

import GroupContext from "../../context"

import "./index.less"

const ChannelsListItem = (props) => {
	const { group, channel } = props

	const handleOnClick = () => {
		if (app.cores.mediartc.state().channelId === channel._id) {
			return app.location.push(`/groups/channel`)
		}

		return app.cores.mediartc.handlers().joinChannel(group._id, channel._id)
	}

	const isEmpty = channel.clients.length === 0

	return (
		<div
			className="group-page__channels-panel__list-item"
			onClick={handleOnClick}
		>
			<div className="group-page__channels-panel__list-item__icon">
				{channel.kind === "media" && <Icons.FiVolume1 />}
				{channel.kind === "chat" && <Icons.FiMessageSquare />}
			</div>

			<div className="group-page__channels-panel__list-item__info">
				<div className="group-page__channels-panel__list-item__info__name">
					<p>{channel.name}</p>
				</div>

				<div className="group-page__channels-panel__list-item__info__description">
					<span>{channel.description}</span>
				</div>

				<AnimatePresence>
					{!isEmpty && (
						<motion.div
							className={classnames(
								"group-page__channels-panel__list-item__info__clients",
							)}
							animate={{
								height: "100%",
							}}
							exit={{
								height: 0,
							}}
						>
							{channel.clients.map((client) => {
								return (
									<div
										key={client.userId}
										id={client.userId}
										className="group-page__channels-panel__list-item__info__clients__client"
									>
										<UserAvatar user_id={client.userId} />
									</div>
								)
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}

const ChannelsPanel = () => {
	const group = React.useContext(GroupContext)

	const createChannel = async () => {
		const result = await GroupsModel.channels
			.create(group._id, {
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

	return (
		<div className="group-page__channels-panel">
			<div className="group-page__channels-panel__header">
				<h3>Channels [{group.channels.length}]</h3>
				<Button
					size="small"
					onClick={createChannel}
				>
					+
				</Button>
			</div>

			<div className="group-page__channels-panel__list">
				{group.channels.map((channel) => (
					<ChannelsListItem
						key={channel._id}
						channel={channel}
						group={group}
					/>
				))}
			</div>
		</div>
	)
}

export default ChannelsPanel
