import type {
	AppData,
	Consumer,
	ConsumerDump,
	DtlsParameters,
	MediaKind,
	Producer,
	Router,
	RouterRtpCodecCapability,
	RtpCapabilities,
	RtpParameters,
	Transport,
	WebRtcServer,
	WebRtcTransportDump,
	Worker,
} from "mediasoup/types"

import type {
	SfuNodeEventName,
	SfuNodeEventPayload,
} from "@comty/shared/types/sfu/index"

import BaseLogger from "@comty/shared/utils/logger"
export const logger = BaseLogger.child("router-session")

export type NotifyFn = <K extends SfuNodeEventName>(
	event: K,
	data: SfuNodeEventPayload<K>,
) => void

export interface RouterSessionOptions {
	channelId?: string
	groupId?: string
	mediaCodecs?: RouterRtpCodecCapability[]
}

export interface ProduceParams {
	kind: MediaKind
	rtpParameters: RtpParameters
	appData?: AppData
}

export interface ConsumeParams {
	producerId: string
	rtpCapabilities: RtpCapabilities
	paused?: boolean
}

export interface RouterTransportOptions {
	enableUdp: boolean
	enableTcp: boolean
	preferUdp: boolean
}

export class RouterSession {
	private transports = new Map<string, Transport>()
	private producers = new Map<string, Producer>()
	private consumers = new Map<string, Consumer>()
	private closed = false

	logger: typeof BaseLogger

	private constructor(
		readonly router: Router,
		readonly appData: { channelId?: string; groupId?: string },
		private readonly rtcServer: WebRtcServer,
		private readonly notify: NotifyFn,
		private readonly transportOptions: RouterTransportOptions,
	) {
		this.logger = BaseLogger.child(
			`router(${appData.groupId}/${appData.channelId})`,
		)
	}

	static async create(
		worker: Worker,
		rtcServer: WebRtcServer,
		options: RouterSessionOptions,
		notify: NotifyFn,
		transportOptions: RouterTransportOptions,
	): Promise<RouterSession> {
		const appData = {
			channelId: options.channelId,
			groupId: options.groupId,
		}

		const router = await worker.createRouter({
			mediaCodecs: options.mediaCodecs,
			appData,
		})

		logger.log("router created", appData)

		return new RouterSession(
			router,
			appData,
			rtcServer,
			notify,
			transportOptions,
		)
	}

	get id(): string {
		return this.router.id
	}

	get isClosed(): boolean {
		return this.closed || this.router.closed
	}

	hasTransport(id: string): boolean {
		return this.transports.has(id)
	}

	hasProducer(id: string): boolean {
		return this.producers.has(id)
	}

	hasConsumer(id: string): boolean {
		return this.consumers.has(id)
	}

	async dump() {
		return {
			...(await this.router.dump()),
			rtpCapabilities: this.router.rtpCapabilities,
		}
	}

	canConsume(producerId: string, rtpCapabilities: RtpCapabilities): boolean {
		return this.router.canConsume({ producerId, rtpCapabilities })
	}

	async createTransport(): Promise<WebRtcTransportDump> {
		const transport = await this.router.createWebRtcTransport({
			webRtcServer: this.rtcServer,
			...this.transportOptions,
		})

		this.transports.set(transport.id, transport)
		this.setupTransportEvents(transport)

		const dump = transport.dump()

		this.logger.debug("new transport created:", dump)

		return dump
	}

	async connectTransport(
		transportId: string,
		dtlsParameters: DtlsParameters,
	) {
		await this.getTransport(transportId).connect({ dtlsParameters })

		this.logger.debug("transport connected:", {
			transportId: transportId,
		})

		return { success: true }
	}

	async produce(transportId: string, params: ProduceParams) {
		if (params.kind !== "audio" && params.kind !== "video") {
			throw new OperationError(400, "Invalid media kind")
		}

		const producer = await this.getTransport(transportId).produce({
			kind: params.kind,
			rtpParameters: params.rtpParameters,
			appData: params.appData,
		})

		this.producers.set(producer.id, producer)
		this.setupProducerEvents(producer)

		const obj = {
			id: producer.id,
			kind: producer.kind,
			rtpParameters: producer.rtpParameters,
			appData: producer.appData,
		}

		this.logger.debug(`new producer created:`, obj)

		return obj
	}

	async consume(transportId: string, params: ConsumeParams) {
		const consumer = await this.getTransport(transportId).consume({
			producerId: params.producerId,
			rtpCapabilities: params.rtpCapabilities,
			paused: params.paused ?? false,
		})

		this.consumers.set(consumer.id, consumer)
		this.setupConsumerEvents(consumer)

		const obj = {
			id: consumer.id,
			producerId: consumer.producerId,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
		}

		this.logger.debug(`new consumer created:`, obj)

		return obj
	}

	async consumerControl(
		consumerId: string,
		paused: boolean,
	): Promise<ConsumerDump> {
		if (typeof paused !== "boolean") {
			throw new OperationError(400, "Invalid consumer control payload")
		}

		const consumer = this.getConsumer(consumerId)

		if (paused) {
			await consumer.pause()
		} else {
			await consumer.resume()
			await consumer.requestKeyFrame()
		}

		return consumer.dump()
	}

	async requestKeyframe(consumerId: string) {
		await this.getConsumer(consumerId).requestKeyFrame()

		return { success: true }
	}

	async closeTransport(transportId: string) {
		const transport = this.getTransport(transportId)

		transport.close()

		this.logger.debug(`transport closed:`, {
			id: transportId,
		})

		return { success: true }
	}

	async closeProducer(producerId: string) {
		const producer = this.getProducer(producerId)

		producer.close()

		this.logger.debug(`producer closed:`, {
			id: producerId,
		})

		return { success: true }
	}

	async closeConsumer(consumerId: string) {
		const consumer = this.getConsumer(consumerId)

		consumer.close()

		this.logger.debug(`consumer closed:`, {
			id: consumerId,
		})

		return { success: true }
	}

	async close(): Promise<void> {
		if (this.closed) return

		this.closed = true

		for (const consumer of [...this.consumers.values()]) {
			consumer.close()
		}

		for (const producer of [...this.producers.values()]) {
			producer.close()
		}

		for (const transport of [...this.transports.values()]) {
			transport.close()
		}

		this.consumers.clear()
		this.producers.clear()
		this.transports.clear()

		this.router.close()

		this.logger.debug("router closed:", this.appData)
	}

	private getTransport(id: string): Transport {
		const transport = this.transports.get(id)

		if (!transport) {
			throw new OperationError(404, `Transport [${id}] not found`)
		}

		return transport
	}

	private getProducer(id: string): Producer {
		const producer = this.producers.get(id)

		if (!producer) {
			throw new OperationError(404, `Producer [${id}] not found`)
		}

		return producer
	}

	private getConsumer(id: string): Consumer {
		const consumer = this.consumers.get(id)

		if (!consumer) {
			throw new OperationError(404, `Consumer [${id}] not found`)
		}

		return consumer
	}

	private setupTransportEvents(transport: Transport) {
		transport.on("@close", () => {
			if (!this.transports.delete(transport.id)) return

			this.notify("transport_closed", {
				transport_id: transport.id,
			})
		})
	}

	private setupProducerEvents(producer: Producer) {
		const onClosed = () => {
			if (!this.producers.delete(producer.id)) return

			this.notify("producer_closed", {
				producer_id: producer.id,
			})
		}

		producer.observer.on("close", onClosed)
		producer.on("transportclose", onClosed)
	}

	private setupConsumerEvents(consumer: Consumer) {
		const onClosed = () => {
			if (!this.consumers.delete(consumer.id)) return

			this.notify("consumer_closed", {
				consumer_id: consumer.id,
			})
		}

		consumer.observer.on("close", onClosed)
		consumer.on("transportclose", onClosed)
		consumer.on("producerclose", onClosed)
	}
}

export default RouterSession
