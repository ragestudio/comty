import type { NatsConnection, Subscription } from "@nats-io/transport-node"
import type {
	SfuRouteName,
	SfuRoutePayload,
	SfuRouteResult,
} from "@comty/shared/types/sfu/index"

import { EventEmitter } from "tseep/lib/ee-safe"
import { OperationError } from "linebridge/classes/OperationError/index"
import {
	EventDataEncode,
	EventDataDecode,
} from "@comty/shared/types/event_data"

export class IPC extends EventEmitter {
	nats: NatsConnection
	controlSub: Subscription | null = null
	subscriptions: Map<string, Subscription> = new Map()

	constructor(nats: NatsConnection) {
		super()

		this.nats = nats
	}

	get sfuControlSubject() {
		return "sfu:control"
	}

	get sfuIpcPrefixSubject() {
		return "sfu:ipc:"
	}

	async handleFromSubscription(sub: Subscription) {
		for await (const msg of sub) {
			try {
				let decoded: any

				try {
					decoded = msg.json()
				} catch {
					continue
				}

				if (typeof decoded !== "object") continue
				if (!decoded.event) continue

				this.emit(decoded.event, decoded.data, decoded, msg)
			} catch (err) {
				console.error("Failed to process SFU IPC message", err)
			}
		}
	}

	subscribeToControlSubject() {
		if (this.controlSub) return

		this.controlSub = this.nats.subscribe(this.sfuControlSubject)
		this.handleFromSubscription(this.controlSub)
	}

	subscribeToIPCNode(node_id: string) {
		const sub = this.nats.subscribe(`${this.sfuIpcPrefixSubject}${node_id}`)
		this.handleFromSubscription(sub)
		this.subscriptions.set(node_id, sub)
	}

	unsubscribeFromIPCNode(node_id: string) {
		const sub = this.subscriptions.get(node_id)

		if (sub) {
			sub.unsubscribe()
			this.subscriptions.delete(node_id)
		}
	}

	sendToNode<K extends SfuRouteName>(
		node_id: string,
		event: K,
		data?: SfuRoutePayload<K>,
	) {
		this.nats.publish(
			`${this.sfuIpcPrefixSubject}${node_id}`,
			JSON.stringify({ event, data }),
		)
	}

	async requestToNode<K extends SfuRouteName>(
		node_id: string,
		event: K,
		data?: SfuRoutePayload<K>,
	): Promise<SfuRouteResult<K>> {
		const response = await this.nats.request(
			`${this.sfuIpcPrefixSubject}${node_id}`,
			EventDataEncode(event, data),
			{ timeout: 10000 },
		)

		const payload = EventDataDecode(response.data)

		if (payload.error) {
			throw new Error(payload.error)
		}

		return payload.data
	}

	sendToService<K extends SfuRouteName>(
		refName: string,
		event: K,
		data?: SfuRoutePayload<K>,
	) {
		this.nats.publish(`sfu.${refName}.${event}`, JSON.stringify(data ?? {}))
	}

	async requestToService<K extends SfuRouteName>(
		refName: string,
		event: K,
		data?: SfuRoutePayload<K>,
	): Promise<SfuRouteResult<K>> {
		const response = await this.nats.request(
			`sfu.${refName}.${event}`,
			JSON.stringify(data ?? {}),
			{ timeout: 10000 },
		)

		const payload = JSON.parse(Buffer.from(response.data).toString()) as {
			data?: any
			error?: string
			code?: number
		}

		if (payload.error) {
			throw new OperationError(payload.code ?? 500, payload.error)
		}

		return payload.data
	}
}

export default IPC
