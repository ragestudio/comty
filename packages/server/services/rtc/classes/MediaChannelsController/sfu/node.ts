import type { IPC_RegisterNodePayload } from "@comty/shared/types/rtc"
import type { NatsConnection } from "@nats-io/transport-node"
import type { RouterOptions } from "mediasoup/types"

import { RemoteRouterTransport } from "./transport"
import { RemoteRouterProducer } from "./producer"
import { RemoteRouterConsumer } from "./consumer"
import { RemoteRouter } from "./router"
import { IPC } from "../ipc"

export class SFUNode {
	node_id: bigint
	pid: number

	hostname: string
	announced_ip: string
	listens: Record<string, string>[]

	ipc: IPC

	remoteTransports: Map<string, RemoteRouterTransport> = new Map()
	remoteProducers: Map<string, RemoteRouterProducer> = new Map()
	remoteConsumers: Map<string, RemoteRouterConsumer> = new Map()

	constructor(payload: IPC_RegisterNodePayload, nats: NatsConnection) {
		this.node_id = BigInt(payload.node_id)
		this.pid = Number(payload.pid)
		this.hostname = payload.hostname
		this.announced_ip = payload.announced_ip
		this.listens = payload.listens

		this.ipc = new IPC(nats)

		this.ipc.subscribeToIPCNode(this.node_id.toString())

		for (const event of Object.keys(this.events)) {
			this.ipc.on(event, this.events[event])
		}
	}

	events = {
		transport_closed: (data) => {
			const remoteTransport = this.remoteTransports.get(data.transport_id)

			if (remoteTransport) {
				remoteTransport.closed = true
				remoteTransport._emitSfuEvent("@close")
				this.remoteTransports.delete(data.transport_id)
			}
		},
		producer_closed: (data) => {
			const remoteProducer = this.remoteProducers.get(data.producer_id)

			if (remoteProducer) {
				remoteProducer.closed = true
				remoteProducer._handleClosed()
			}
		},
		consumer_closed: (data) => {
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

	async createRouter(
		options?: RouterOptions & { channelId?: string; groupId?: string },
	) {
		return new RemoteRouter(
			this,
			await this.ipc.requestToNode(
				this.node_id.toString(),
				"createRouter",
				options,
			),
		)
	}

	async listRouters() {
		return (await this.ipc.requestToNode(
			this.node_id.toString(),
			"listRouters",
		)) as { id: string; channelId?: string; groupId?: string }[] | undefined
	}

	async getRouter(router_id: string): Promise<RemoteRouter | null> {
		const data = await this.ipc.requestToNode(
			this.node_id.toString(),
			"getRouter",
			{ router_id },
		)

		if (!data) return null

		return new RemoteRouter(this, data)
	}

	async alive() {
		try {
			const response = await this.ipc.requestToNode(
				this.node_id.toString(),
				"alive",
			)

			return !!response
		} catch {
			return false
		}
	}

	serialize() {
		return {
			node_id: this.node_id.toString(),
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
