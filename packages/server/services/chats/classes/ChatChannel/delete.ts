import ChatChannel from "."

import MessageModel from "@db/channel_messages"
import DeletedMessageModel from "@db/channel_deleted_messages"

export default async function (
	this: ChatChannel,
	user: any,
	messageId: string,
) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	if (typeof messageId !== "string") {
		throw new OperationError(400, "Missing messageId")
	}

	// try to fetch the message
	const message = await MessageModel.findOne({
		channel_id: this.channel._id.toString(),
		_id: messageId,
	})

	if (!message) {
		throw new OperationError(404, "Message not found")
	}

	// check if is the owner of the message
	// TODO: use permissions api
	if (message.user_id !== user._id.toString()) {
		throw new OperationError(403, "You are not the owner of this message")
	}

	await message.delete()

	// create a new deleted message obj
	const deletedMessage = DeletedMessageModel.obj({
		_id: messageId,
		channel_id: this.channel._id.toString(),
		deleted_by_user_id: user._id.toString(),
		deleted_at: new Date(),
	})

	await deletedMessage.save()

	// if onDelete callback is defined, execute it
	if (typeof this.onDelete === "function") {
		try {
			await this.onDelete(user, message)
		} catch (error) {
			console.error("Failed to execute onDelete hook", error)
			throw error
		}
	}

	this.sendEventToChannelTopic("channel:message:deleted", {
		_id: message._id.toString(),
	})

	return message
}
