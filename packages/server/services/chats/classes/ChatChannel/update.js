export default async function (user, message_id, update = {}) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	if (!message_id) {
		throw new OperationError(400, "Missing message_id")
	}

	// find the message
	const message = await this.MessageModel.findOneAsync({
		channel_id: this.channel._id.toString(),
		_id: message_id,
	})

	if (!message) {
		throw new OperationError(404, "Message not found")
	}

	// validate the payload
	this.validateMessagePayload(update)

	if (update.message) {
		message.message = String(update.message)
	}

	if (update.attachments) {
		message.attachments = update.attachments
	}

	message.updated_at = new Date().toISOString()

	await message.saveAsync()

	return message.toJSON()
}
