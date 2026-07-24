import type { ProducerOptions } from "mediasoup-client/types"
import type { Producer } from "./Producer"

import MediaRTC from "../mediartc.core"

export default class Producers extends Map<string, Producer> {
	core: MediaRTC

	constructor(core: MediaRTC, data?: Iterable<readonly [string, Producer]>) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	setRemote(producer: Producer): Producer | null {
		if (!producer) {
			return null
		}

		producer.remote = true

		this.set(producer.producerId, producer)
		this.core.state.remoteProducers.push(producer)

		return producer
	}

	delRemote(producer: Producer): Producer | null {
		if (!producer) {
			return null
		}

		this.delete(producer.producerId)

		this.core.state.remoteProducers =
			this.core.state.remoteProducers.filter(
				(p: Producer) => p.producerId !== producer.producerId,
			)

		return producer
	}

	produce = async (payload: ProducerOptions): Promise<Producer> => {
		if (!this.core.device || !this.core.sendTransport) {
			throw new Error("Device or send transport not ready")
		}

		const producer = (await this.core.sendTransport.produce(
			payload,
		)) as Producer

		producer.userId = app.userData._id
		producer.self = true
		producer.observer.on("close", () => this.onSelfProducerClosed(producer))

		// @ts-ignore
		const { readable, writable } = producer.rtpSender.createEncodedStreams()

		if (producer.appData.mediaTag === "user-mic") {
			this.core.rtpMicWorker.postMessage(
				{
					id: producer.id,
					type: "producer",
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

		this.set(producer.id, producer)

		return producer
	}

	onSelfProducerClosed = (producer: Producer) => {
		if (!producer) {
			return null
		}

		this.delete(producer.id)

		this.core.socket.emit("channel:produce:stop", {
			producerId: producer.id,
		})
	}

	getSelfProducers() {
		return Array.from(this.values()).filter((producer) => producer.self)
	}

	clear(): void {
		super.clear()
		this.core.state.remoteProducers = []
	}
}
