import type { MediaKind, RtpParameters } from "mediasoup/types"
import type { SfuConsumerResult } from "@comty/shared/types/sfu/index"
import type { SFUNode } from "./node"

import { EventEmitter } from "tseep/lib/ee-safe"

export class RemoteRouterConsumer extends EventEmitter {
	node: SFUNode

	id: string
	closed: boolean
	producerId: string
	kind: MediaKind
	rtpParameters: RtpParameters

	constructor(node: SFUNode, data: SfuConsumerResult) {
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
		await this.node.request("requestKeyframe", {
			consumer_id: this.id,
		})
	}

	close() {
		if (this.closed) return
		this.closed = true

		this.node.send("closeConsumer", { consumer_id: this.id })

		this.node.unregisterRemoteConsumer(this.id)

		this.emit("transportclose")
		this.emit("producerclose")
	}
}

export default RemoteRouterConsumer
