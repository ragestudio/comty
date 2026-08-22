import ChatChannel from "@shared-classes/Spaces/ChatChannel"
import ActivityModel from "@db/direct_messages_activity"
import NotificationsModel from "@db/notifications"

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
			ActivityModel.findOne(senderActivityQuery),
			ActivityModel.findOne(receiverActivityQuery),
		])

		if (!senderActivity) {
			senderActivity = ActivityModel.obj({
				...senderActivityQuery,
				to_user_id: receiver_user_id,
			})
		}

		if (!receiverActivity) {
			receiverActivity = ActivityModel.obj({
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

		await Promise.all([senderActivity.save(), receiverActivity.save()])

		// create explicit notification for receiver
		try {
			const notification = NotificationsModel.obj({
				_id: this.controller.snowflake.nextId().toString(),
				user_id: receiver_user_id,
				type: "dm_message",
				reference_id: this.channel._id.toString(),
				sender_id: sender_user_id,
				data: JSON.stringify({
					short_message,
					message_id: message._id,
				}),
				created_at: now,
			})

			await notification.save()

			// send in background
			this.notifyActivityUpdated(sender_user_id, senderActivity.toRaw())
			this.notifyActivityUpdated(
				receiver_user_id,
				receiverActivity.toRaw(),
			)

			// also emit notification:new
			this.controller.server.engine.ws.senders.toUserId(
				receiver_user_id,
				"notification:new",
				notification.toRaw(),
			)
		} catch (error) {
			console.error(error)
		}
	}
}
