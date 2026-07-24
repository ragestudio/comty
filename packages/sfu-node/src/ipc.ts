import type SFU_Node from "./index"

import { EventEmitter } from "tseep/lib/ee-safe"
import {
	NatsConnection,
	headers,
	MsgHdrs,
	Subscription,
	Msg,
} from "@nats-io/transport-node"
import {
	EventData,
	EventDataEncode,
	EventDataDecode,
} from "@comty/shared/types/event_data"

export class IPCMsg implements Msg {
	decoded: EventData

	constructor(private _msg: Msg) {
		this.decoded = EventDataDecode(this._msg.data)
	}

	get subject(): string {
		return this._msg.subject
	}
	get sid(): number {
		return this._msg.sid
	}
	get reply(): string | undefined {
		return this._msg.reply
	}
	get data(): Uint8Array {
		return this._msg.data
	}
	get headers(): MsgHdrs | undefined {
		return this._msg.headers
	}

	respond_raw(data?: Uint8Array, opts?: any): boolean {
		return this._msg.respond(data, opts)
	}
	json<T = unknown>(): T {
		return this._msg.json<T>()
	}
	string(): string {
		return this._msg.string()
	}

	decode(): EventData {
		if (!this.decoded) {
			this.decoded = EventDataDecode(this.data)
		}
		return this.decoded
	}

	respond(data?: any, error?: any) {
		if (error && !(error instanceof Error)) {
			error = new Error(error)
		}

		return this.respond_raw(
			EventDataEncode(this.decoded.event, data, error, true),
		)
	}
}

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
				let msgImpl: IPCMsg = new IPCMsg(msg)

				if (!msgImpl.decoded.event) continue

				console.debug(
					`[IPC][${msg.subject}] ${String(msgImpl.decoded.event)}:`,
					msgImpl.decoded.data,
				)

				this.emit(msgImpl.decoded.event, msgImpl.decoded.data, msgImpl)
			} catch (err) {
				console.error("Failed to handle IPC message:", err)
			}
		}
	}

	async publish(event: string, data?: any) {
		this.nats.publish(this.nodeSubject, EventDataEncode(event, data), {
			headers: this.base_headers,
		})
	}

	async publish_to_control(event: string, data?: any) {
		this.nats.publish("sfu:control", EventDataEncode(event, data), {
			headers: this.base_headers,
		})
	}
}

export default IPC
