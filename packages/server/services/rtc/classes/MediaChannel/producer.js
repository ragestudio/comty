export default class Producer {
	constructor({ instance, transport, channel, client }) {
		this.transport = transport
		this.channel = channel
		this.client = client
		this.instance = instance

		this.userId = client.userId
		this.groupId = channel.group_id
		this.channelId = channel._id
	}

	producer = null
	id = null

	async initialize({ kind, rtpParameters, appData }) {
		this.producer = await this.transport.produce({
			kind,
			rtpParameters,
			appData,
		})

		this.id = this.producer.id

		this.producer.on("transportclose", this.onProducerClose)
		this.producer.observer.on("close", this.onProducerClose)

		await this.onProducerOpen()
	}

	onProducerOpen = async () => {
		console.log(`Producer [${this.id}] opened`, {
			userId: this.userId,
		})

		// send event to other clients that this producer has joined
		await this.instance.sendToClients(
			this.client,
			`media:channel:producer:joined`,
			this.serialize(),
		)

		const instanceProducers = this.instance.producers

		// check if the instance producers set has client userId
		if (!instanceProducers.has(this.userId)) {
			instanceProducers.set(this.userId, new Map())
		}

		const userProducers = instanceProducers.get(this.userId)

		userProducers.set(this.id, this)
	}

	onProducerClose = async () => {
		// Check if already closed to avoid duplicate processing
		if (this._closing) {
			return
		}

		this._closing = true

		console.log(`Producer [${this.id}] closed`, {
			userId: this.userId,
		})

		try {
			// notify to other clients that this producer has closed
			await this.instance.sendToClients(
				this.client,
				`media:channel:producer:left`,
				this.serialize(),
			)
		} catch (error) {
			console.error(
				`Error notifying clients about producer close:`,
				error,
			)
		}

		try {
			const instanceProducers = this.instance.producers
			const userProducers = instanceProducers.get(this.userId)

			// remove the producer from the map if it exists
			if (userProducers) {
				userProducers.delete(this.id)

				// if no more user producers, remove the map from the instance
				if (userProducers.size === 0) {
					instanceProducers.delete(this.userId)
				}
			}
		} catch (error) {
			console.error(`Error removing producer from maps:`, error)
		}

		// Clean up event listeners to prevent memory leaks
		if (this.producer) {
			try {
				this.producer.removeAllListeners("transportclose")
				if (this.producer.observer) {
					this.producer.observer.removeAllListeners("close")
				}
			} catch (error) {
				// Ignore errors during cleanup
			}
		}
	}

	serialize = () => {
		return {
			id: this.producer ? this.producer.id : this.id,
			producerId: this.producer ? this.producer.id : this.id,
			channelId: this.channelId,
			groupId: this.groupId,
			userId: this.userId,
			kind: this.producer ? this.producer.kind : null,
			appData: this.producer ? this.producer.appData : null,
		}
	}

	// Keep backward compatibility
	seralize = this.serialize
}
