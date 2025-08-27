import Producer from "../producer"
import validateRtpParameters from "../utils/validateRtpParameters"

export default async function (client, payload) {
	try {
		if (!this.clients.has(client)) {
			throw new Error("Client not in channel")
		}

		if (!payload) {
			throw new OperationError(400, "Payload not defined")
		}

		if (!payload.transportId || !payload.kind || !payload.rtpParameters) {
			throw new OperationError(400, "Missing required parameters")
		}

		const transport = client.transports.get(payload.transportId)

		if (!transport) {
			throw new OperationError(404, "Transport not found")
		}

		// Validate RTP parameters
		validateRtpParameters(payload.rtpParameters, payload.kind)

		// check if producers set has client userId
		if (!this.producers.has(client.userId)) {
			this.producers.set(client.userId, new Map())
		}

		// create producer
		const producer = new Producer({
			transport: transport,
			client: client,
			channel: this.data,
			// events: {
			// 	transportclose: this.removeProducer,
			// },
		})

		await producer.initialize(payload)

		// add the producer to user producers
		const userProducers = this.producers.get(client.userId)

		userProducers.set(producer.id, producer)

		// send event other clients
		this.sendToClients(
			client,
			`media:channel:producer:joined`,
			producer.seralize(),
		)

		return producer.seralize()
	} catch (error) {
		console.error(`Error producing for ${client.userId}:`, error)
		throw error
	}
}
