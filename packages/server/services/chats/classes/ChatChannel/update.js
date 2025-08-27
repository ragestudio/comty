export default async function (user, messageId, update = {}) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	if (!messageId) {
		throw new OperationError(400, "Missing messageId")
	}

	const Message = this.scylla.model("channel_messages")

	const entry = await Message.findOneAsync({
		channel_id: this.channel._id.toString(),
		_id: messageId,
	})

	if (!entry) {
		throw new OperationError(404, "Message not found")
	}

	this.validateMessagePayload(update)

	if (update.message) {
		entry.message = String(update.message)
	}

	entry.updated_at = new Date().toISOString()

	await entry.saveAsync()

	return entry.toJSON()
}
