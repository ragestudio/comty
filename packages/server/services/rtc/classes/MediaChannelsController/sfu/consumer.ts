import type { MediaKind } from "mediasoup/types"
import type { SFUNode } from "./node"

import { EventEmitter } from "tseep/lib/ee-safe"

export class RemoteRouterConsumer extends EventEmitter {
	node: SFUNode

	id: string
	closed: boolean
	producerId: string
	kind: MediaKind
	rtpParameters: any

	constructor(node: SFUNode, data: any) {
		super()

		this.node = node
		this.id = data.id
		this.closed = false
		this.producerId = data.producerId
		this.kind = data.kind
		this.rtpParameters = data.rtpParameters

		this.node.registerRemoteConsumer(this)
	}

	async requestKeyFrame() {
		await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"requestKeyFrame",
			{ producer_id: this.producerId },
		)
	}

	close() {
		if (this.closed) return
		this.closed = true

		this.node.ipc.sendToNode(
			this.node.node_id.toString(),
			"closeConsumer",
			{ consumer_id: this.id },
		)

		this.node.unregisterRemoteConsumer(this.id)

		this.emit("transportclose")
		this.emit("producerclose")
	}
}

export default RemoteRouterConsumer
