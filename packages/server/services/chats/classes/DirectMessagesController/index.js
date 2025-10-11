import ChatChannel from "../ChatChannel"
import { User } from "@db_models"

function genPairKey(id1, id2) {
	return [id1, id2].sort().join("-")
}

function genShortMessage(messageObj) {
	if (
		!messageObj.message &&
		messageObj.attachments &&
		messageObj.attachments.length > 0
	) {
		return "Media file"
	}

	return messageObj.message
}

class DMChatChannel extends ChatChannel {
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

export default class DirectMessagesController {
	constructor(server) {
		this.server = server
	}

	get snowflake() {
		return this.server.contexts.snowflake
	}

	get RoomsModel() {
		return this.server.contexts.scylla.model("direct_messages_rooms")
	}

	get ActivityModel() {
		return this.server.contexts.scylla.model("direct_messages_activity")
	}

	get = async (from_user_id, to_user_id) => {
		if (typeof from_user_id !== "string") {
			throw new OperationError(400, "from_user_id must be a string")
		}

		if (typeof to_user_id !== "string") {
			throw new OperationError(400, "to_user_id must be a string")
		}

		// create the sorted pairkey
		const pair_key = genPairKey(from_user_id, to_user_id)

		// search by pairkey
		let room = await this.RoomsModel.findOneAsync(
			{
				pair_key: pair_key,
			},
			{
				raw: true,
			},
		)

		// if the room doesn't exist, create it
		if (!room) {
			// console.debug(
			// 	`Creating direct message room with pair key [${pair_key}]`,
			// )

			const room_id = this.snowflake.nextId().toString()
			const created_at = new Date().toISOString()

			room = new this.RoomsModel({
				_id: room_id,
				pair_key: pair_key,
				created_at: created_at,
			})

			await room.saveAsync()

			room = room.toJSON()
		}

		// just return the room instance
		return new DMChatChannel(this, room)
	}

	// TODO: implement pagination
	rooms = async (userId, { limit = 20, offset = 0 } = {}) => {
		const activity = await this.ActivityModel.findAsync(
			{
				user_id: userId,
				$limit: limit,
			},
			{
				raw: true,
			},
		)

		if (activity.length === 0) {
			return []
		}

		const pairs = activity.map((reg) =>
			genPairKey(reg.user_id, reg.to_user_id),
		)

		const users = new Map()

		// if there are any activities, fetch the users
		if (activity.length > 0) {
			const data = await User.find({
				_id: {
					$in: activity.map((a) => a.to_user_id),
				},
			})

			for (const user of data) {
				users.set(user._id.toString(), user)
			}
		}

		let rooms = await this.RoomsModel.findAsync(
			{
				pair_key: {
					$in: pairs,
				},
			},
			{
				raw: true,
			},
		)

		// insert last message_at & sort
		rooms = rooms.map((room) => {
			const activityRef = activity.find((a) => a.room_id === room._id)

			room.last_message_at = activityRef.last_message_at
			room.to_user_id = activityRef.to_user_id

			room.short_message = activityRef.short_message
			room.direction = activityRef.direction
			room.user = users.get(room.to_user_id)

			return room
		})

		rooms = rooms.sort((a, b) => {
			return b.last_message_at - a.last_message_at
		})

		return rooms
	}
}
