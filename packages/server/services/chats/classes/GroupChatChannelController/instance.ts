import { Doc, InferDoc } from "@ragestudio/scylla-odm/types"
import ChatChannel from "../ChatChannel"

import { schema } from "@db/channel_messages"
import LastChannelMessageIdModel from "@db/group_channels_last_message_id"

export default class GroupChatChannel extends ChatChannel {
	constructor(controller, channel) {
		super(controller, channel)
		this.topic = "chats:channel"
	}

	onWrite = async (user, message: Doc<InferDoc<typeof schema>>) => {
		try {
			await LastChannelMessageIdModel.update({
				channel_id: this.channel._id,
				_id: message._id,
			})
		} catch (err) {
			console.error("Failed to update channel last message id", err)
		}

		try {
			this.controller.server.engine.ws.senders.toTopic(
				`group:${this.channel.group_id}`,
				`group:${this.channel.group_id}:channels:new:message`,
				{ ...message.toRaw(), user: user },
			)
		} catch (err) {
			console.error("Failed to send event to group", err)
		}
	}

	onDelete = async (deleted_message) => {
		try {
			const lastMessage = await this.getLastMessageObj()

			await LastChannelMessageIdModel.update({
				channel_id: this.channel._id,
				_id: lastMessage._id,
			})
		} catch (err) {
			console.error("Failed to update channel last message id", err)
		}
	}
}
