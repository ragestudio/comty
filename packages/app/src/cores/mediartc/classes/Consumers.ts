import type Consumer from "./Consumer"

import MediaRTC from "../mediartc.core"
import Producer from "./Producer"

export default class Consumers {
	core: MediaRTC

	constructor(core: MediaRTC) {
		if (!core) {
			throw new Error("Core not provided")
		}
		this.core = core
	}

	get _mirrorMap(): Map<string, Consumer> {
		return this.core.recvTransport?._consumers || new Map()
	}

	get size(): number {
		return this._mirrorMap.size
	}

	get(key: string): Consumer | undefined {
		return this._mirrorMap.get(key)
	}

	has(key: string): boolean {
		return this._mirrorMap.has(key)
	}

	values(): IterableIterator<Consumer> {
		return this._mirrorMap.values()
	}

	keys(): IterableIterator<string> {
		return this._mirrorMap.keys()
	}

	entries(): IterableIterator<[string, Consumer]> {
		return this._mirrorMap.entries()
	}

	forEach(
		callback: (
			value: Consumer,
			key: string,
			map: Map<string, Consumer>,
		) => void,
		thisArg?: any,
	): void {
		this._mirrorMap.forEach(callback, thisArg)
	}

	[Symbol.iterator](): IterableIterator<[string, Consumer]> {
		return this._mirrorMap[Symbol.iterator]()
	}

	start = async ({
		producerId,
		userId,
		kind,
		appData,
	}: Partial<Producer>): Promise<Consumer> => {
		try {
			if (!this.core.socket) {
				throw new Error("Socket not available or ready")
			}

			if (!this.core.device || !this.core.recvTransport) {
				throw new Error("Device or transport not ready")
			}

			const existingConsumer = this.findByProducerId(producerId)

			if (existingConsumer) {
				return existingConsumer
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
				this.stop(consumer.id)
			})

			const { readable, writable } =
				consumer.rtpReceiver.createEncodedStreams()

			if (consumer.appData.mediaTag === "user-mic") {
				this.core.rtpMicWorker.postMessage(
					{
						id: consumer.id,
						type: "consumer",
						readableStream: readable,
						writableStream: writable,
					},
					[readable, writable],
				)
			} else {
				readable
					.pipeTo(writable)
					.catch((e) => console.warn("Stream pipe error", e))
			}

			return consumer
		} catch (error) {
			this.core.console.error("Error creating consumer:", error)
		}
	}

	stop = async (consumerId: string): Promise<void> => {
		try {
			const consumer = this.get(consumerId)

			if (!consumer) {
				return
			}

			if (consumer.closed) {
				return
			}

			this.core.console.log("Stopping consumer", {
				consumerId: consumerId,
				consumer: consumer,
			})

			consumer.close()

			return
		} catch (error) {
			this.core.console.error("Error stopping consumer:", error)
			throw error
		}
	}

	stopByProducerId = async (producerId: string): Promise<void> => {
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

	stopAll = async (): Promise<void> => {
		try {
			for (const consumer of this.values()) {
				await this.stop(consumer.id)
			}
		} catch (error) {
			this.core.console.error("Error stopping all consumers:", error)
		}
	}

	findByProducerId = (producerId: string): Consumer | undefined => {
		for (const consumer of this.values()) {
			if (consumer.producerId === producerId) {
				return consumer
			}
		}

		return undefined
	}

	findByUserId = (userId: string): Consumer[] => {
		const consumers: Consumer[] = []
		for (const consumer of this.values()) {
			if (consumer.userId === userId) {
				consumers.push(consumer)
			}
		}
		return consumers
	}
}
