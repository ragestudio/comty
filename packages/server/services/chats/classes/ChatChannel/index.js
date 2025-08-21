import { User } from "@db_models"

export default class ChatChannel {
	constructor(controller, channel) {
		this.controller = controller
		this.channel = channel

		this.scylla = controller.server.contexts.scylla
		this.snowflake = controller.server.contexts.snowflake
	}

	static defaultLimits = {
		maxMessageLength: 1200,
		maxAttachments: 10,
	}

	async read(client, payload) {
		const { limit = 50, beforeId } = payload

		let query = {
			channel_id: this.channel._id.toString(),
			$limit: limit,
			$orderby: {
				$desc: "_id",
			},
		}

		if (beforeId) {
			query._id = {
				$lt: beforeId,
			}
		}

		const Message = this.scylla.model("channel_messages")

		let messages = await Message.findAsync(query, {
			raw: true,
		})

		messages = messages.reverse()

		// fetch user data
		let users = await User.find({
			_id: {
				$in: messages.map((message) => message.user_id),
			},
		}).select("_id username public_name roles avatar cover")

		return {
			items: messages,
			users: users,
		}
	}

	async write(user, payload) {
		try {
			if (!user) {
				throw new OperationError(400, "Missing user object")
			}
			if (!payload.message && !payload.attachments) {
				throw new OperationError(400, "Missing message or attachments")
			}
			if (
				payload.message.length >
				ChatChannel.defaultLimits.maxMessageLength
			) {
				throw new OperationError(400, "Message is too long")
			}

			if (
				payload.attachments.length >
				ChatChannel.defaultLimits.maxAttachments
			) {
				throw new OperationError(400, "Too many attachments")
			}

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
		} catch (error) {
			console.error(error)
			throw new OperationError(
				500,
				"Failed to create message, probably bad request",
			)
		}
	}

	async delete(client, messageId) {}

	async sendEventToChannelTopic(event, payload) {
		return this.controller.server.engine.ws.senders.toTopic(
			`chats:channel:${this.channel._id.toString()}`,
			event,
			payload,
		)
	}
}
