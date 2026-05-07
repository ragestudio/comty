import type ChatChannel from "../ChatChannel"
import MessageModel from "@db/channel_messages"

export default async function (this: ChatChannel, user, payload) {
	if (!user) {
		throw new OperationError(400, "Missing user object")
	}

	this.validateMessagePayload(payload)

	const _id = this.snowflake.nextId().toString()
	const created_at = new Date()

	const batch = this.scylla.batch()

	let message = MessageModel.obj({
		_id: _id,
		channel_id: this.channel._id.toString(),
		user_id: user._id.toString(),
		message: payload.message && String(payload.message),
		attachments: payload.attachments as any[],
		reply_to_id: payload.reply_to_id,
		created_at: created_at,
		sticker: payload.sticker,
	})

	MessageModel.batch.insert(batch, message.toRaw())

	//await message.save()

	if (typeof this.onWrite === "function") {
		try {
			await this.onWrite(user, message, batch)
		} catch (error) {
			console.error(error)
			throw new OperationError(500, "Failed to execute onWrite hook")
		}
	}

	await batch.execute()

	const obj = {
		...message.toRaw(),
		user: user,
	}

	// send to channel
	this.sendEventToChannelTopic("channel:message", obj)

	return obj
}
