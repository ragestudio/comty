import readMethod from "./read"
import writeMethod from "./write"
import updateMethod from "./update"
import deleteMethod from "./delete"

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

	read = readMethod.bind(this)
	write = writeMethod.bind(this)
	delete = deleteMethod.bind(this)
	update = updateMethod.bind(this)

	validateMessagePayload = (payload) => {
		if (!payload.message && !payload.attachments) {
			throw new OperationError(400, "Missing message or attachments")
		}

		if (
			payload.message.length > ChatChannel.defaultLimits.maxMessageLength
		) {
			throw new OperationError(400, "Message is too long")
		}

		if (
			payload.attachments &&
			payload.attachments?.length >
				ChatChannel.defaultLimits.maxAttachments
		) {
			throw new OperationError(400, "Too many attachments")
		}
	}

	async sendEventToChannelTopic(event, payload) {
		return this.controller.server.engine.ws.senders.toTopic(
			`chats:channel:${this.channel._id.toString()}`,
			event,
			payload,
		)
	}
}
