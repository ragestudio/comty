import readMethod from "./read"
import writeMethod from "./write"
import updateMethod from "./update"
import deleteMethod from "./delete"

export default class ChatChannel {
	constructor(
		controller,
		channel,
		{ onWrite, onRead, topic = "chats:channel" } = {},
	) {
		this.controller = controller
		this.channel = channel

		this.scylla = controller.server.contexts.scylla
		this.snowflake = controller.server.contexts.snowflake

		this.onWrite = onWrite
		this.onRead = onRead
		this.topic = topic
	}

	get MessageModel() {
		return this.scylla.model("channel_messages")
	}

	get _id() {
		return this.channel._id
	}

	static defaultLimits = {
		maxMessageLength: 1200,
		maxAttachments: 10,
	}

	read = readMethod.bind(this)
	write = writeMethod.bind(this)
	delete = deleteMethod.bind(this)
	update = updateMethod.bind(this)

	validateMessagePayload = (payload) => {
		if (!payload.message && !payload.attachments && !payload.sticker) {
			throw new OperationError(
				400,
				"Missing message or attachments or sticker",
			)
		}

		if (payload.message) {
			if (
				payload.message.length >
				ChatChannel.defaultLimits.maxMessageLength
			) {
				throw new OperationError(400, "Message is too long")
			}
		}

		if (payload.attachments) {
			if (
				payload.attachments &&
				payload.attachments?.length >
					ChatChannel.defaultLimits.maxAttachments
			) {
				throw new OperationError(400, "Too many attachments")
			}
		}
	}

	async sendEventToChannelTopic(event, data) {
		return this.controller.server.engine.ws.senders.toTopic(
			`${this.topic}:${this.channel._id.toString()}`,
			event,
			data,
		)
	}
}
