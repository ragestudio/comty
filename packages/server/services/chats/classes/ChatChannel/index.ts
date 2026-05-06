import readMethod from "./read"
import writeMethod from "./write"
import updateMethod from "./update"
import deleteMethod from "./delete"

import MessageModel from "@db/channel_messages"

import type { Worker as SnowflakeWorker } from "snowflake-uuid"
import type ScyllaClientType from "@ragestudio/scylla-odm"

type onWriteCallbackType = (user: RTEClient, message: any) => Promise<void>
type onReadCallbackType = (
	user: RTEClient,
	messages: any[],
	users: any[],
) => Promise<void>
type onDeleteCallbackType = (user: RTEClient, message: any) => Promise<void>

type ChatChannelOptions = {
	onWrite?: onWriteCallbackType
	onRead?: onReadCallbackType
	onDelete?: onDeleteCallbackType
	topic?: string
}

export default class ChatChannel {
	constructor(controller: any, channel: any, options?: ChatChannelOptions) {
		this.controller = controller
		this.channel = channel
		this.topic = options?.topic ?? "chats:channel"

		this.scylla = controller.server.contexts.scylla
		this.snowflake = controller.server.contexts.snowflake

		if (typeof options?.onWrite === "function") {
			this.onWrite = options.onWrite
		}
		if (typeof options?.onRead === "function") {
			this.onRead = options.onRead
		}
		if (typeof options?.onDelete === "function") {
			this.onDelete = options.onDelete
		}
	}

	topic: string
	scylla: ScyllaClientType
	snowflake: SnowflakeWorker
	controller: any
	channel: any

	onWrite: onWriteCallbackType
	onRead: onReadCallbackType
	onDelete: onDeleteCallbackType

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

	validateMessagePayload = (payload: any) => {
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

	async getLastMessageObj() {
		const message = await MessageModel.find({
			channel_id: this._id,
			$limit: 1,
			$orderby: {
				_id: "desc",
			},
		})

		if (message.length === 0) {
			throw new OperationError(404, "No last message found")
		}

		return message[0]
	}

	async sendEventToChannelTopic(event: string, data: any) {
		return this.controller.server.engine.ws.senders.toTopic(
			`${this.topic}:${this.channel._id.toString()}`,
			event,
			data,
		)
	}
}
