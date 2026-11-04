import type {
	onWriteCallbackType,
	onDeleteCallbackType,
} from "@shared-classes/Spaces/ChatChannel"
import type { ChatChannelOptions } from "@shared-classes/Spaces/ChatChannel"
import type GroupChatChannelController from "."

import ChatChannel from "@shared-classes/Spaces/ChatChannel"
import LastChannelMessageIdModel from "@db/group_channels_last_message_id"

export default class GroupChatChannel extends ChatChannel {
	constructor(
		controller: GroupChatChannelController,
		channel: any,
		options?: ChatChannelOptions,
	) {
		super(controller, channel, options)
		this.topic = "chats:channel"
	}

	declare controller: GroupChatChannelController

	onWrite: onWriteCallbackType = async (user, message, batch) => {
		// update last message id
		LastChannelMessageIdModel.batch.update(batch, {
			channel_id: this.channel._id,
			_id: message._id,
		})

		try {
			// avoid sending the message content on the group topic, only
			// subscribers of the channel topic may read it
			this.controller.server.engine.ws.senders.toTopic(
				`group:${this.channel.group_id}`,
				`group:${this.channel.group_id}:channels:new:message`,
				{
					_id: message._id,
					channel_id: message.channel_id,
					user_id: message.user_id,
					created_at: message.created_at,
				},
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
