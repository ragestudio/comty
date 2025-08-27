export default async function (user, payload) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	this.validateMessagePayload(payload)

	const Message = this.scylla.model("channel_messages")

	const _id = this.snowflake.nextId().toString()
	const created_at = new Date().toISOString()

	let message = new Message({
		_id: _id,
		channel_id: this.channel._id.toString(),
		user_id: user._id.toString(),
		message: String(payload.message),
		attachments: payload.attachments,
		created_at: created_at.toString(),
	})

	await message.saveAsync()

	const obj = {
		...message.toJSON(),
		user: user,
	}

	// send to channel
	this.sendEventToChannelTopic("channel:message:new", obj)

	return obj
}
