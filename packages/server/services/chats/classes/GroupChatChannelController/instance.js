import ChatChannel from "@classes/ChatChannel"

export default class GroupChatChannel extends ChatChannel {
	constructor(controller, channel) {
		super(controller, channel)
		this.topic = "chats:channel"
	}

	static get LastChannelMessageIdModel() {
		return global.scylla.model("group_channels_last_message_id")
	}

	onWrite = async (user, message) => {
		message = message.toRaw()

		try {
			await this.controller.server.engine.ws.senders.toTopic(
				`group:${this.channel.group_id}`,
				`group:${this.channel.group_id}:channels:new:message`,
				{ ...message, user: user },
			)
		} catch (err) {
			console.error("Failed to send event to group", err)
		}

		try {
			await GroupChatChannel.LastChannelMessageIdModel.update({
				channel_id: this.channel._id,
				_id: message._id,
			})
		} catch (err) {
			console.error("Failed to update channel last message id", err)
		}
	}

	onDelete = async (deleted_message) => {
		try {
			const lastMessage = await this.getLastMessageObj()

			await GroupChatChannel.LastChannelMessageIdModel.update({
				channel_id: this.channel._id,
				_id: lastMessage._id,
			})
		} catch (err) {
			console.error("Failed to update channel last message id", err)
		}
	}
}
