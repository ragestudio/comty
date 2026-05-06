import MessageModel, {
	schema as ChannelMessagesSchema,
} from "@db/channel_messages"

export default async function (
	user,
	message_id,
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

	await message.save()

	return message.toRaw()
}
