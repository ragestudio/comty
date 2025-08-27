export default class Producer {
	constructor({ transport, channel, client, events = {} }) {
		this.transport = transport
		this.channelData = channel
		this.client = client
		this.events = events

		this.channelId = channel.id
		this.groupId = channel.group_id
		this.userId = client.userId
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

		// setup events
		for (const [event, handler] of Object.entries(this.events)) {
			this.producer.on(event, (...args) => {
				handler(this, ...args)
			})
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
