import ChatChannel from "@classes/ChatChannel"

function genShortMessage(messageObj) {
	if (
		!messageObj.message &&
		messageObj.attachments &&
		messageObj.attachments.length > 0
	) {
		return "Media file"
	}

	if (messageObj.sticker) {
		return "Sticker"
	}

	return messageObj.message
}

export default class DMChatChannel extends ChatChannel {
	constructor(controller, channel) {
		super(controller, channel)
		this.topic = "chat:dm"
	}

	get ActivityModel() {
		return this.scylla.model("direct_messages_activity")
	}

	notifyActivityUpdated = async (user_id, activity) => {
		try {
			if (!user_id) {
				console.error(
					"Failed to notify activity update for DM room: No user_id provided",
					this.channel._id,
				)
				return null
			}

			const clients =
				await this.controller.server.engine.ws.find.clientsByUserId(
					user_id,
				)

			for (const client of clients) {
				try {
					client.emit("dm:activity:update", activity)
				} catch (error) {
					console.error(error)
				}
			}
		} catch (error) {
			console.error(error)
		}
	}

	onWrite = async (user, message) => {
		const now = new Date()

		const users_ids = this.channel.pair_key.split("-")

		const [sender_user_id, receiver_user_id] = users_ids.sort((i) => {
			return i === user._id.toString() ? -1 : 1
		})

		if (!sender_user_id || !receiver_user_id) {
			console.error(
				"Failed to update activity for DM room",
				this.channel._id,
			)
			return null
		}

		const senderActivityQuery = {
			user_id: sender_user_id,
			room_id: this.channel._id.toString(),
		}

		const receiverActivityQuery = {
			user_id: receiver_user_id,
			room_id: this.channel._id.toString(),
		}

		// check if exists
		let [senderActivity, receiverActivity] = await Promise.all([
			this.ActivityModel.findOneAsync(senderActivityQuery),
			this.ActivityModel.findOneAsync(receiverActivityQuery),
		])

		if (!senderActivity) {
			senderActivity = new this.ActivityModel({
				...senderActivityQuery,
				to_user_id: receiver_user_id,
			})
		}

		if (!receiverActivity) {
			receiverActivity = new this.ActivityModel({
				...receiverActivityQuery,
				to_user_id: sender_user_id,
			})
		}

		const short_message = genShortMessage(message)

		// update states
		senderActivity.last_message_at = now
		senderActivity.short_message = short_message
		senderActivity.direction = "outgoing"

		receiverActivity.last_message_at = now
		receiverActivity.short_message = short_message
		receiverActivity.direction = "incoming"

		await Promise.all([
			senderActivity.saveAsync(),
			receiverActivity.saveAsync(),
		])

		// send in background
		try {
			this.notifyActivityUpdated(sender_user_id, senderActivity.toJSON())
			this.notifyActivityUpdated(
				receiver_user_id,
				receiverActivity.toJSON(),
			)
		} catch (error) {
			console.error(error)
		}
	}

	// onRead = async (user, messages, users) => {
	// 	const users_ids = this.channel.pair_key.split("-")

	// 	const [sender_user_id, receiver_user_id] = users_ids.sort((i) => {
	// 		return i === user._id ? -1 : 1
	// 	})

	// 	console.log("onRead", {
	// 		sender_user_id,
	// 		receiver_user_id,
	// 	})
	// }
}
