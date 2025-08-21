export default class Consumers extends Map {
	constructor(core, data) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	start = async ({ producerId, userId, kind, appData }) => {
		try {
			if (!this.core.socket) {
				throw new Error("Socket not available or ready")
			}

			if (!this.core.device || !this.core.recvTransport) {
				throw new Error("Device or transport not ready")
			}

			// if consumer already exists, return it
			if (this.has(producerId)) {
				return this.get(producerId)
			}

			this.core.console.log("Starting consumer", {
				producerId,
				userId,
				kind,
				appData,
			})

			const consumerInfo = await this.core.socket.call(
				"channel:consume",
				{
					producerId: producerId,
					transportId: this.core.recvTransport.id,
					rtpCapabilities: this.core.device.rtpCapabilities,
				},
			)

			consumerInfo.rtpParameters.codecs[0].opusDtx = true
			consumerInfo.rtpParameters.encodings[0].dtx = true

			const consumer = await this.core.recvTransport.consume({
				id: consumerInfo.id,
				producerId: consumerInfo.producerId,
				kind: consumerInfo.kind,
				rtpParameters: {
					...consumerInfo.rtpParameters,
				},
				appData: appData,
			})

			consumer.userId = userId

			// Consumer event handlers
			consumer.on("transportclose", () => {
				this.core.console.warn(
					`Consumer [${consumer.id}] transport closed`,
				)
				this.stop(producerId)
			})

			// add to consumers
			this.set(consumer.id, consumer)
			this.core.state.availableConsumers.push(consumer.id)

			return consumer
		} catch (error) {
			this.core.console.error("Error creating consumer:", error)
		}
	}

	stop = async (consumerId) => {
		try {
			const consumer = this.get(consumerId)

			if (!consumer) {
				return false
			}

			if (consumer.closed) {
				// consumer already closed
				this.delete(consumerId)

				return false
			}

			this.core.console.log("Stopping consumer", {
				consumerId: consumerId,
				consumer: consumer,
			})

			// stop the consumer
			await consumer.close()

			// delete from map
			this.delete(consumerId)

			// delete from available consumers
			this.core.state.availableConsumers =
				this.core.state.availableConsumers.filter(
					(id) => id !== consumerId,
				)

			return consumer
		} catch (error) {
			this.core.console.error("Error stopping consumer:", error)
			throw error
		}
	}

	stopByProducerId = async (producerId) => {
		try {
			for (const consumer of this.values()) {
				if (consumer.producerId === producerId) {
					this.stop(consumer.id)
				}
			}
		} catch (error) {
			this.core.console.error("Error stopping consumers:", error)
			throw error
		}
	}

	stopAll = async () => {
		try {
			for (const consumer of this.values()) {
				this.stop(consumer.id)
			}
		} catch (error) {
			this.core.console.error("Error stopping consumers:", error)
			throw error
		}
	}
}
