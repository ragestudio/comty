export default async function (user, payload) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	this.validateMessagePayload(payload)

	const _id = this.snowflake.nextId().toString()
	const created_at = new Date()

	let message = this.MessageModel.obj({
		_id: _id,
		channel_id: this.channel._id.toString(),
		user_id: user._id.toString(),
		message: payload.message && String(payload.message),
		attachments: payload.attachments,
		reply_to_id: payload.reply_to_id,
		created_at: created_at,
		sticker: payload.sticker,
	})

	await message.save()

	if (typeof this.onWrite === "function") {
		try {
			await this.onWrite(user, message)
		} catch (error) {
			console.error(error)
			throw new OperationError(500, "Failed to execute onWrite hook")
		}
	}

	const obj = {
		...message.toRaw(),
		user: user,
	}

	// send to channel
	this.sendEventToChannelTopic("channel:message", obj)

	return obj
}
