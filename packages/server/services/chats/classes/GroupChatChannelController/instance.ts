import ChatChannel from "../ChatChannel"
import type { onWriteCallbackType, onDeleteCallbackType } from "../ChatChannel"

import LastChannelMessageIdModel from "@db/group_channels_last_message_id"

export default class GroupChatChannel extends ChatChannel {
	constructor(controller, channel) {
		super(controller, channel)
		this.topic = "chats:channel"
	}

	onWrite: onWriteCallbackType = async (user, message, batch) => {
		// update last message id
		LastChannelMessageIdModel.batch.update(batch, {
			channel_id: this.channel._id,
			_id: message._id,
		})

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

	onDelete: onDeleteCallbackType = async (user, message, batch) => {
		try {
			// retrieve the last message
			const lastMessage = await this.getFirstMessageBeforeId(message._id)

			if (lastMessage) {
				// update last message id
				LastChannelMessageIdModel.batch.update(batch, {
					channel_id: this.channel._id,
					_id: lastMessage._id,
				})
			}
		} catch (err) {
			console.error("Failed to update channel last message id", err)
		}
	}
}
