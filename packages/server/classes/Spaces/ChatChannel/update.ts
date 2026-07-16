import type ChatChannel from "../ChatChannel"

import MessageModel, {
	schema as ChannelMessagesSchema,
} from "@db/channel_messages"
import ChannelLogModel from "@db/channel_log"

export default async function (
	this: ChatChannel,
	user: any,
	message_id: string,
	update = {} as typeof ChannelMessagesSchema.fields,
) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	if (!message_id) {
		throw new OperationError(400, "Missing message_id")
	}

	// find the message
	const message = await MessageModel.findOne({
		channel_id: this.channel._id.toString(),
		_id: message_id,
	})

	if (!message) {
		throw new OperationError(404, "Message not found")
	}

	// validate the payload
	this.validateMessagePayload(update)

	if (typeof update.message === "string") {
		message.message = String(update.message)
	}

	if (Array.isArray(update.attachments)) {
		message.attachments = update.attachments
	}

	message.updated_at = new Date()

	const batch = this.scylla.batch()
	await message.save()

	ChannelLogModel.batch.insert(batch, {
		channel_id: this.channel._id.toString(),
		log_id: this.snowflake.nextId().toString(),
		type: "message:updated",
		target_id: message._id,
		actor_id: user._id.toString(),
		timestamp: new Date(),
	})

	await batch.execute()

	const data = message.toRaw()

	this.sendEventToChannelTopic("channel:message:updated", data)

	return data
}
