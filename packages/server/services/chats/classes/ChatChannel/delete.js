export default async function (user, messageId) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	if (typeof messageId !== "string") {
		throw new OperationError(400, "Missing messageId")
	}

	const Message = this.scylla.model("channel_messages")

	// try to fetch the message
	const message = await Message.findOneAsync({
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

	await message.deleteAsync()

	this.sendEventToChannelTopic("channel:message:deleted", {
		_id: message._id.toString(),
	})

	return message
}
