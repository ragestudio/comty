import type { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"
import type ScyllaClientType from "@ragestudio/scylla-odm"
import type { RTEClient } from "linebridge"

import { Doc, InferDoc } from "@ragestudio/scylla-odm/types"
import { Batch } from "@ragestudio/scylla-odm"

import readMethod from "./read"
import writeMethod from "./write"
import updateMethod from "./update"
import deleteMethod from "./delete"

import ChannelMessagesModel from "@db/channel_messages"

export type onWriteCallbackType = (
	user: RTEClient,
	message: Doc<InferDoc<typeof ChannelMessagesModel.schema>>,
	batch: Batch,
) => Promise<void>
export type onReadCallbackType = (
	user: RTEClient,
	messages: Doc<InferDoc<typeof ChannelMessagesModel.schema>>[],
	users: any[],
	batch?: Batch,
) => Promise<void>
export type onDeleteCallbackType = (
	user: RTEClient,
	message: Doc<InferDoc<typeof ChannelMessagesModel.schema>>,
	batch: Batch,
) => Promise<void>

export type ChatChannelOptions = {
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
		const message = await ChannelMessagesModel.find(
			{
				channel_id: this._id,
			},
			{
				limit: 1,
				orderBy: {
					_id: "desc",
				},
			},
		)

		if (message.length === 0) {
			throw new OperationError(404, "No last message found")
		}

		return message[0]
	}

	async getFirstMessageBeforeId(messageId: string) {
		return await ChannelMessagesModel.findOne(
			{
				channel_id: this._id,
				_id: {
					$lt: messageId,
				},
			},
			{
				orderBy: {
					_id: "desc",
				},
			},
		)
	}

	async sendEventToChannelTopic(event: string, data: any) {
		return this.controller.server.engine.ws.senders.toTopic(
			`${this.topic}:${this.channel._id.toString()}`,
			event,
			data,
		)
	}

	async sendSystemMessage(message: string, meta?: { user_id?: string }) {
		const _id = this.snowflake.nextId().toString()
		const created_at = new Date()

		const batch = this.scylla.batch()

		const msg = ChannelMessagesModel.obj({
			_id: _id,
			channel_id: this.channel._id.toString(),
			user_id: meta?.user_id || null,
			message: message,
			flags: ["system"],
			created_at: created_at,
		})

		ChannelMessagesModel.batch.insert(batch, msg.toRaw())

		if (typeof this.onWrite === "function") {
			try {
				await this.onWrite(null, msg, batch)
			} catch (error) {
				console.error(error)
				throw new OperationError(500, "Failed to execute onWrite hook")
			}
		}

		await batch.execute()

		const obj = {
			...msg.toRaw(),
		}

		this.sendEventToChannelTopic("channel:message", obj)

		return obj
	}
}
