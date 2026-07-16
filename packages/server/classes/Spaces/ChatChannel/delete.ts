import ChatChannel from "."

import MessageModel from "@db/channel_messages"
import ChannelLogModel from "@db/channel_log"

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

	// create batch
	const batch = this.scylla.batch()

	// delete message
	MessageModel.batch.delete(batch, message.toRaw())

	ChannelLogModel.batch.insert(batch, {
		channel_id: this.channel._id.toString(),
		log_id: this.snowflake.nextId().toString(),
		type: "message:deleted",
		target_id: message._id,
		actor_id: user._id,
		timestamp: new Date(),
	})

	// if onDelete callback is defined, execute it
	if (typeof this.onDelete === "function") {
		try {
			await this.onDelete(user, message, batch)
		} catch (error) {
			console.error("Failed to execute onDelete hook", error)
			throw error
		}
	}

	// execute the batch
	await batch.execute()

	this.sendEventToChannelTopic("channel:message:deleted", {
		_id: message._id.toString(),
	})

	return message
}
