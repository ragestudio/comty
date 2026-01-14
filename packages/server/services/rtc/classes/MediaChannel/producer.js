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

		this.producer.observer.on("close", this.onProducerClose)

		await this.onProducerOpen()
	}

	onProducerOpen = async () => {
		// send event to other clients that this producer has joined
		await this.instance.sendToClients(
			this.client,
			`media:channel:producer:joined`,
			this.seralize(),
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
		// notify to other clients that this producer has closed
		await this.instance.sendToClients(
			this.client,
			`media:channel:producer:left`,
			this.seralize(),
		)

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
	}

	seralize = () => {
		return {
			id: this.producer.id,
			producerId: this.producer.id,
			channelId: this.channelId,
			groupId: this.groupId,
			userId: this.userId,
			kind: this.producer.kind,
			appData: this.producer.appData,
		}
	}
}
