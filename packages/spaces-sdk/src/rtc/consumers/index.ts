import type { RTC } from ".."
import type { Producer } from "../producers/producer"
import type { Consumer } from "./consumer"
import type { ConsumerOptions } from "mediasoup-client/types"

import { attachSpeakingDetection } from "../speaking"
import loggerBase from "@/utils/logger"

export const logger = loggerBase.child("consumers")

// time to wait for the socket, device and recv transport to exist. events can
// arrive while the channel is still attaching, so waiting avoids losing them
const READY_TIMEOUT = 10000
const READY_POLL_INTERVAL = 100

export class Consumers extends Map<string, Consumer> {
	constructor(core: RTC) {
		super()
		this.core = core
	}

	core: RTC

	speakingDetectors: Map<string, () => void> = new Map()

	// consumers being created, keyed by producer id, to avoid racing events
	private pendingStarts: Map<string, Promise<Consumer | void>> = new Map()

	async start({
		producerId,
		userId,
		kind,
		appData,
	}: Partial<Producer>): Promise<Consumer | void> {
		if (typeof producerId !== "string") {
			logger.error("Cannot start consumer without a producerId")
			return
		}

		if (typeof userId !== "string") {
			logger.error("Cannot start consumer without a userId")
			return
		}

		const existingConsumer = this.findByProducerId(producerId)

		if (existingConsumer) {
			if (!existingConsumer.closed) {
				// heal consumers whose detection never got attached
				this.ensureSpeakingDetection(existingConsumer)
				return existingConsumer
			}

			this.delete(existingConsumer.id)
		}

		const pending = this.pendingStarts.get(producerId)

		if (pending) return pending

		const task = this.startConsumer({ producerId, userId, kind, appData })
			.catch((error) => {
				logger.error("Error creating consumer:", error)
			})
			.finally(() => this.pendingStarts.delete(producerId))

		this.pendingStarts.set(producerId, task)

		return task
	}

	private async startConsumer({
		producerId,
		userId,
		kind,
		appData,
	}: Partial<Producer>): Promise<Consumer | void> {
		if (!(await this.waitForReady())) {
			logger.error("Device or transport not ready, cannot start consumer")
			return
		}

		if (
			!this.core.socket ||
			!this.core.device ||
			!this.core.transports.recv
		) {
			logger.error("Device or transport not ready, cannot start consumer")
			return
		}

		if (typeof producerId !== "string" || typeof userId !== "string") {
			return
		}

		logger.debug("Starting consumer", {
			producerId,
			userId,
			kind,
			appData,
		})

		// create a new remote consumer
		// IMPORTANT: we need to set paused to true.
		const consumerInfo = (await this.core.socket.call("channel:consume", {
			producerId: producerId,
			transportId: this.core.transports.recv.id,
			rtpCapabilities: this.core.device.rtpCapabilities,
			paused: true,
		})) as Consumer

		const consumeParams: ConsumerOptions = {
			id: consumerInfo.id,
			producerId: consumerInfo.producerId,
			kind: consumerInfo.kind,
			rtpParameters: {
				...consumerInfo.rtpParameters,
			},
			appData: appData,
		}

		// create the local consumer
		const consumer = (await this.core.transports.recv.consume(
			consumeParams,
		)) as Consumer

		// set the consumer userId
		consumer.userId = userId

		// track the consumer so it can be paused, resumed or stopped later
		this.set(consumer.id, consumer)

		// attach detection after creation so it never depends on callback timing
		this.ensureSpeakingDetection(consumer)

		// Consumer event handlers
		consumer.on("transportclose", () => {
			logger.debug(`Consumer [${consumer.id}] transport closed`)
			this.stop(consumer.id)
		})

		consumer.on("trackended", () => {
			logger.debug(`Consumer [${consumer.id}] track ended`)
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

		return consumer
	}

	private async waitForReady(): Promise<boolean> {
		const startedAt = Date.now()

		while (Date.now() - startedAt < READY_TIMEOUT) {
			const state = this.core.getState().state

			// no channel in progress, do not wait for transports that will never
			// be created
			if (state === "disconnected" || state === "failed") {
				return false
			}

			if (
				this.core.socket &&
				this.core.device &&
				this.core.transports.recv
			) {
				return true
			}

			await new Promise((resolve) =>
				setTimeout(resolve, READY_POLL_INTERVAL),
			)
		}

		return false
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

			logger.log("Stopping consumer", {
				consumerId: consumerId,
				consumer: consumer,
			})

			try {
				this.core.socket.emit("channel:consumer_stop", {
					consumer_id: consumerId,
					producer_id: consumer.producerId,
				})
			} catch (err) {
				logger.error(`Failed to signal consumer stopped`, err)
			}

			consumer.close()

			return
		} catch (error) {
			logger.error("Error stopping consumer:", error)
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
			logger.error("Error stopping consumers:", error)
			throw error
		}
	}

	async stopAll(): Promise<void> {
		try {
			for (const consumer of this.values()) {
				await this.stop(consumer.id)
			}
		} catch (error) {
			logger.error("Error stopping all consumers:", error)
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

	// attaches detection to a mic consumer, safe to call more than once
	ensureSpeakingDetection(consumer: Consumer) {
		if (consumer.closed) return
		if (consumer.kind !== "audio") return
		if (consumer.appData?.mediaTag !== "user-mic") return
		if (this.speakingDetectors.has(consumer.id)) return

		const rtpReceiver = consumer.rtpReceiver
		const track = consumer.track ?? rtpReceiver?.track ?? null

		const detach = attachSpeakingDetection(
			{
				id: consumer.id,
				role: "receiver",
				rtpReceiver,
				track,
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

		consumer.isSpeaking = false

		if (!this.hasOtherSpeakingConsumer(consumer)) {
			this.removeSpeakingClient(consumer.userId)
		}
	}

	private hasOtherSpeakingConsumer(consumer: Consumer): boolean {
		for (const other of this.values()) {
			if (other.id === consumer.id) continue
			if (other.userId !== consumer.userId) continue
			if (other.isSpeaking) return true
		}

		return false
	}

	onSpeakingChange(consumer: Consumer, isSpeaking: boolean) {
		logger.log("onSpeakingChange", consumer.id, isSpeaking)

		consumer.isSpeaking = isSpeaking

		// another stream of the same user is still speaking
		if (!isSpeaking && this.hasOtherSpeakingConsumer(consumer)) {
			return
		}

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
