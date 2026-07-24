import type { NatsConnection, Subscription } from "@nats-io/transport-node"

import { EventEmitter } from "tseep/lib/ee-safe"
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

	sendToNode(node_id: string, event: string, data?: any) {
		this.nats.publish(
			`${this.sfuIpcPrefixSubject}${node_id}`,
			JSON.stringify({ event, data }),
		)
	}

	async requestToNode(node_id: string, event: string, data?: any) {
		const response = await this.nats.request(
			`${this.sfuIpcPrefixSubject}${node_id}`,
			EventDataEncode(event, data),
		)

		const payload = EventDataDecode(response.data)

		if (payload.error) {
			throw new Error(payload.error)
		}

		return payload.data
	}
}

export default IPC
