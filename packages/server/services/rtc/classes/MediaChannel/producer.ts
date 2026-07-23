import type { MediaChannel } from "./"

export type ProducerParams = {
	instance: MediaChannel
	transport: any
	channel: any
	client: any
}

export type ProducerInitializeParams = {
	kind: string
	rtpParameters: any
	appData?: any
}

export type SerializedProducer = {
	id: string
	producerId: string
	channelId: string
	groupId: string
	userId: string
	kind: string | null
	appData: any
}

export default class Producer {
	instance: MediaChannel

	transport: any
	channel: any
	client: any

	userId: string
	groupId: string
	channelId: string

	producer: any = null
	id: string | null = null
	_closing: boolean = false

	constructor({ instance, transport, channel, client }: ProducerParams) {
		this.transport = transport
		this.channel = channel
		this.client = client
		this.instance = instance

		this.userId = client.userId
		this.groupId = channel.group_id
		this.channelId = channel._id
	}

	async initialize({
		kind,
		rtpParameters,
		appData,
	}: ProducerInitializeParams) {
		this.producer = await this.transport.produce({
			kind,
			rtpParameters,
			appData,
		})

		this.id = this.producer.id

		this.producer.on("transportclose", this.onProducerClose)
		this.producer.observer.on("close", this.onProducerClose)

		if (this.instance.controller) {
			this.instance.controller.markInstanceDirty(this.channelId)
		}

		await this.onProducerOpen()
	}

	onProducerOpen = async () => {
		// send event to other clients that this producer has joined
		await this.instance.sendToClients(
			this.client,
			`media:channel:producer:joined`,
			this.serialize(),
		)

		this.instance.events.emit("producer:open", this)

		const instanceProducers = this.instance.producers

		// check if the instance producers set has client userId
		if (!instanceProducers.has(this.userId)) {
			instanceProducers.set(this.userId, new Map())

			if (this.instance.controller) {
				this.instance.controller.markInstanceDirty(this.channelId)
			}
		}

		const userProducers = instanceProducers.get(this.userId)

		userProducers.set(this.id!, this)

		if (this.instance.controller) {
			this.instance.controller.markInstanceDirty(this.channelId)
		}
	}

	onProducerClose = async () => {
		// Check if already closed to avoid duplicate processing
		if (this._closing) {
			return
		}

		this._closing = true

		try {
			// notify to other clients that this producer has closed
			await this.instance.sendToClients(
				this.client,
				`media:channel:producer:left`,
				this.serialize(),
			)
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error notifying clients about producer close:`,
				error,
			)
		}

		this.instance.events.emit("producer:close", this)

		try {
			const instanceProducers = this.instance.producers
			const userProducers = instanceProducers.get(this.userId)

			// remove the producer from the map if it exists
			if (userProducers) {
				userProducers.delete(this.id!)

				// if no more user producers, remove the map from the instance
				if (userProducers.size === 0) {
					instanceProducers.delete(this.userId)
				}

				if (this.instance.controller) {
					this.instance.controller.markInstanceDirty(this.channelId)
				}
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error removing producer from maps:`,
				error,
			)
		}

		// Clean up event listeners to prevent memory leaks
		if (this.producer) {
			try {
				this.producer.removeAllListeners("transportclose")

				if (this.producer.observer) {
					this.producer.observer.removeAllListeners("close")
				}

				if (this.instance.controller) {
					this.instance.controller.markInstanceDirty(this.channelId)
				}
			} catch (error) {
				// Ignore errors during cleanup
			}
		}
	}

	serialize = (): SerializedProducer => {
		return {
			id: this.producer ? this.producer.id : this.id!,
			producerId: this.producer ? this.producer.id : this.id!,
			channelId: this.channelId,
			groupId: this.groupId,
			userId: this.userId,
			kind: this.producer ? this.producer.kind : null,
			appData: this.producer ? this.producer.appData : null,
		}
	}
}
