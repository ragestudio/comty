import type {
	SfuConsumerControlPayload,
	SfuCreateRouterPayload,
	SfuListRoutersResult,
	SfuNodeEventPayload,
	SfuNodeListen,
	SfuNodeRegisterPayload,
	SfuRequestKeyframePayload,
	SfuRouteName,
	SfuRoutePayload,
	SfuRouteResult,
} from "@comty/shared/types/sfu/index"
import type { NatsConnection } from "@nats-io/transport-node"

import { RemoteRouterTransport } from "./transport"
import { RemoteRouterProducer } from "./producer"
import { RemoteRouterConsumer } from "./consumer"
import { RemoteRouter } from "./router"
import { IPC } from "../ipc"

export class SFUNode {
	node_id: bigint
	pid: number
	refName: string | null

	hostname: string
	announced_ip: string
	listens: SfuNodeListen[]

	ipc: IPC

	remoteTransports: Map<string, RemoteRouterTransport> = new Map()
	remoteProducers: Map<string, RemoteRouterProducer> = new Map()
	remoteConsumers: Map<string, RemoteRouterConsumer> = new Map()

	constructor(payload: SfuNodeRegisterPayload, nats: NatsConnection) {
		this.node_id = BigInt(payload.node_id)
		this.pid = Number(payload.pid)
		this.refName = payload.refName ?? null
		this.hostname = payload.hostname
		this.announced_ip = payload.announced_ip
		this.listens = payload.listens

		this.ipc = new IPC(nats)

		this.ipc.subscribeToIPCNode(this.node_id.toString())

		for (const [event, fn] of Object.entries(this.events)) {
			this.ipc.on(event, fn)
		}
	}

	events = {
		transport_closed: (data: SfuNodeEventPayload<"transport_closed">) => {
			const remoteTransport = this.remoteTransports.get(data.transport_id)

			if (remoteTransport) {
				remoteTransport.closed = true
				remoteTransport._emitSfuEvent("@close")
				this.remoteTransports.delete(data.transport_id)
			}
		},
		producer_closed: (data: SfuNodeEventPayload<"producer_closed">) => {
			const remoteProducer = this.remoteProducers.get(data.producer_id)

			if (remoteProducer) {
				remoteProducer.closed = true
				remoteProducer._handleClosed()
			}
		},
		consumer_closed: (data: SfuNodeEventPayload<"consumer_closed">) => {
			const remoteConsumer = this.remoteConsumers.get(data.consumer_id)

			if (remoteConsumer) {
				remoteConsumer.closed = true
				remoteConsumer.removeAllListeners("transportclose")
				remoteConsumer.removeAllListeners("producerclose")

				this.remoteConsumers.delete(data.consumer_id)
			}
		},
	}

	get natsNodeSubjectStr(): string {
		return `sfu:ipc:${this.node_id}`
	}

	registerRemoteTransport(transport: RemoteRouterTransport) {
		this.remoteTransports.set(transport.id, transport)
	}

	unregisterRemoteTransport(id: string) {
		this.remoteTransports.delete(id)
	}

	registerRemoteProducer(producer: RemoteRouterProducer) {
		this.remoteProducers.set(producer.id, producer)
	}

	unregisterRemoteProducer(id: string) {
		this.remoteProducers.delete(id)
	}

	registerRemoteConsumer(consumer: RemoteRouterConsumer) {
		this.remoteConsumers.set(consumer.id, consumer)
	}

	unregisterRemoteConsumer(id: string) {
		this.remoteConsumers.delete(id)
	}

	async createRouter(options?: SfuCreateRouterPayload) {
		return new RemoteRouter(this, await this.request("createRouter", options))
	}

	async listRouters(): Promise<SfuListRoutersResult> {
		return await this.request("listRouters")
	}

	async getRouter(router_id: string): Promise<RemoteRouter | null> {
		const data = await this.request("getRouter", { router_id })
		if (!data) return null

		return new RemoteRouter(this, data)
	}

	async alive() {
		try {
			return !!(await this.request("alive"))
		} catch {
			return false
		}
	}

	async consumerControl(payload: SfuConsumerControlPayload) {
		return await this.request("consumerControl", payload)
	}

	async requestKeyframe(payload: SfuRequestKeyframePayload) {
		return await this.request("requestKeyframe", payload)
	}

	async request<K extends SfuRouteName>(
		event: K,
		payload?: SfuRoutePayload<K>,
	): Promise<SfuRouteResult<K>> {
		if (this.refName) {
			return await this.ipc.requestToService(this.refName, event, payload)
		}

		return await this.ipc.requestToNode(this.node_id.toString(), event, payload)
	}

	send<K extends SfuRouteName>(event: K, payload?: SfuRoutePayload<K>) {
		if (this.refName) {
			this.ipc.sendToService(this.refName, event, payload)
			return
		}

		this.ipc.sendToNode(this.node_id.toString(), event, payload)
	}

	serialize() {
		return {
			node_id: this.node_id.toString(),
			refName: this.refName,
			pid: this.pid.toString(),
			hostname: this.hostname,
			announced_ip: this.announced_ip,
			listens: this.listens,
			remoteTransports: this.remoteTransports,
			remoteProducers: this.remoteProducers,
			remoteConsumers: this.remoteConsumers,
		}
	}
}

export default SFUNode
