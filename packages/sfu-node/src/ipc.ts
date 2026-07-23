import type SFU_Node from "./index"

import {
	NatsConnection,
	headers,
	MsgHdrs,
	Subscription,
} from "@nats-io/transport-node"
import { EventEmitter } from "tseep/lib/ee-safe"

export class IPC extends EventEmitter {
	node: SFU_Node
	nats: NatsConnection

	base_headers: MsgHdrs = headers()
	ipc_sub: Subscription

	constructor(node: SFU_Node) {
		super()

		this.node = node
		this.nats = node.nats

		this.base_headers.append("node_id", this.node.node_id.toString())

		this.ipc_sub = this.nats.subscribe(this.nodeSubject)
		this.readSub(this.ipc_sub)
	}

	get nodeSubject() {
		return `sfu:ipc:${this.node.node_id}`
	}

	async readSub(sub: Subscription) {
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

				console.debug(
					`[IPC][${msg.subject}] ${decoded.event}:`,
					decoded.data,
				)
				this.emit(decoded.event, decoded.data, msg)
			} catch (err) {
				console.error("Failed to handle IPC message:", err)
			}
		}
	}

	async publish(event: string, data?: any) {
		this.nats.publish(this.nodeSubject, JSON.stringify({ event, data }), {
			headers: this.base_headers,
		})
	}

	async publish_to_control(event: string, data?: any) {
		this.nats.publish("sfu:control", JSON.stringify({ event, data }), {
			headers: this.base_headers,
		})
	}
}

export default IPC
