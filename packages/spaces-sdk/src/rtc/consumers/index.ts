import type { RTC } from ".."
import type { Producer } from "../producers/producer"
import type { Consumer } from "./consumer"

import { attachSpeakingDetection } from "../speaking"

export class Consumers extends Map<string, Consumer> {
	constructor(core: RTC) {
		super()
		this.core = core
	}

	core: RTC

	speakingDetectors: Map<string, () => void> = new Map()

	async start({
		producerId,
		userId,
		kind,
		appData,
	}: Partial<Producer>): Promise<Consumer | void> {
		try {
			if (!this.core.socket) {
				throw new Error("Socket not available or ready")
			}

			if (!this.core.device || !this.core.transports.recv) {
				throw new Error("Device or transport not ready")
			}

			if (typeof producerId !== "string") {
				throw new Error("Must contain a producerId")
			}

			if (typeof userId !== "string") {
				throw new Error("Must contain a userId")
			}

			const existingConsumer = this.findByProducerId(producerId)

			if (existingConsumer) {
				return existingConsumer
			}

			console.debug("Starting consumer", {
				producerId,
				userId,
				kind,
				appData,
			})

			// create a new remote consumer
			// IMPORTANT: we need to set paused to true.
			const consumerInfo = (await this.core.socket.call(
				"channel:consume",
				{
					producerId: producerId,
					transportId: this.core.transports.recv.id,
					rtpCapabilities: this.core.device.rtpCapabilities,
					paused: true,
				},
			)) as Consumer

			// create the local consumer
			const consumer = (await this.core.transports.recv.consume({
				id: consumerInfo.id,
				producerId: consumerInfo.producerId,
				kind: consumerInfo.kind,
				rtpParameters: {
					...consumerInfo.rtpParameters,
				},
				appData: appData,
			})) as Consumer

			// set the consumer userId
			consumer.userId = userId

			// track the consumer so it can be paused, resumed or stopped later
			this.set(consumer.id, consumer)

			// Consumer event handlers
			consumer.on("transportclose", () => {
				console.debug(`Consumer [${consumer.id}] transport closed`)
				this.stop(consumer.id)
			})

			// important to call the sfu to resume the remote consumer
			await this.core.socket.call("channel:consumer_control", {
				consumer_id: consumer.id,
				paused: false,
			})

			if (
				this.core.self.isDeafened &&
				consumer.kind === "audio" &&
				consumer.appData.mediaTag === "user-mic"
			) {
				consumer.pause()
			}

			if (consumer.appData.mediaTag === "user-mic") {
				this.setupSpeakingDetection(consumer)
			}

			return consumer
		} catch (error) {
			console.error("Error creating consumer:", error)
		}
	}

	async stop(consumerId: string): Promise<void> {
		try {
			if (!this.core.socket) {
				throw new Error("Socket not available or ready")
			}

			const consumer = this.get(consumerId)

			if (!consumer) {
				return
			}

			this.detachSpeakingDetection(consumer)

			this.delete(consumerId)

			if (consumer.closed) {
				return
			}

			console.log("Stopping consumer", {
				consumerId: consumerId,
				consumer: consumer,
			})

			try {
				this.core.socket.emit("channel:consumer_stop", {
					consumer_id: consumerId,
					producer_id: consumer.producerId,
				})
			} catch (err) {
				console.error(`Failed to signal consumer stopped`, err)
			}

			consumer.close()

			return
		} catch (error) {
			console.error("Error stopping consumer:", error)
			throw error
		}
	}

	async stopByProducerId(producerId: string): Promise<void> {
		try {
			for (const consumer of this.values()) {
				if (consumer.producerId === producerId) {
					this.stop(consumer.id)
				}
			}
		} catch (error) {
			console.error("Error stopping consumers:", error)
			throw error
		}
	}

	async stopAll(): Promise<void> {
		try {
			for (const consumer of this.values()) {
				await this.stop(consumer.id)
			}
		} catch (error) {
			console.error("Error stopping all consumers:", error)
		}
	}

	findByProducerId(producerId: string): Consumer | undefined {
		for (const consumer of this.values()) {
			if (consumer.producerId === producerId) {
				return consumer
			}
		}

		return undefined
	}

	setupSpeakingDetection(consumer: Consumer) {
		const detach = attachSpeakingDetection(
			{
				id: consumer.id,
				role: "receiver",
				rtpReceiver: consumer.rtpReceiver,
			},
			(isSpeaking) => this.onSpeakingChange(consumer, isSpeaking),
		)

		if (detach) {
			this.speakingDetectors.set(consumer.id, detach)
		}
	}

	detachSpeakingDetection(consumer: Consumer) {
		const detach = this.speakingDetectors.get(consumer.id)

		if (detach) {
			detach()
			this.speakingDetectors.delete(consumer.id)
		}

		if (consumer.isSpeaking) {
			consumer.isSpeaking = false
		}

		this.removeSpeakingClient(consumer.userId)
	}

	onSpeakingChange(consumer: Consumer, isSpeaking: boolean) {
		console.log("onSpeakingChange", consumer.id, isSpeaking)

		consumer.isSpeaking = isSpeaking

		const userId = consumer.userId

		this.core.setState((prev) => {
			const isSpeakingClient = prev.speakingClients.includes(userId)

			if (isSpeaking === isSpeakingClient) {
				return {}
			}

			if (isSpeaking) {
				return { speakingClients: [...prev.speakingClients, userId] }
			}

			return {
				speakingClients: prev.speakingClients.filter(
					(id) => id !== userId,
				),
			}
		})
	}

	removeSpeakingClient(userId: string) {
		this.core.setState((prev) => {
			if (!prev.speakingClients.includes(userId)) {
				return {}
			}

			return {
				speakingClients: prev.speakingClients.filter(
					(id) => id !== userId,
				),
			}
		})
	}

	findByUserId(userId: string): Consumer[] {
		const consumers: Consumer[] = []

		for (const consumer of this.values()) {
			if (consumer.userId === userId) {
				consumers.push(consumer)
			}
		}

		return consumers
	}
}

export default Consumers
