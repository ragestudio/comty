import type { SFUNode } from "./node"
import type { SfuRouterDump } from "@comty/shared/types/sfu/index"
import type { RtpCapabilities } from "mediasoup/types"

import RemoteRouterTransport from "./transport"

export class RemoteRouter {
	node: SFUNode
	id: string
	closed: boolean = false
	rtpCapabilities: RtpCapabilities

	constructor(node: SFUNode, data: SfuRouterDump) {
		if (!node) {
			throw new Error("SFUNode is required to create a RemoteRouter")
		}

		this.node = node
		this.id = data.id
		this.rtpCapabilities = data.rtpCapabilities
	}

	get natsRouterSubjectStr(): string {
		return `sfu:ipc:${this.node.node_id}:router:${this.id}`
	}

	close() {
		if (this.closed) return
		this.closed = true

		this.node.send("closeRouter", {
			id: this.id,
		})
	}

	async createWebRtcTransport() {
		const response = await this.node.request("createRouterWebRtcTransport", {
			router_id: this.id,
		})

		return new RemoteRouterTransport(this.node, response)
	}

	async canConsume({
		producerId,
		rtpCapabilities,
	}: {
		producerId: string
		rtpCapabilities: RtpCapabilities
	}) {
		const result = await this.node.request("routerCanConsume", {
			router_id: this.id,
			producerId,
			rtpCapabilities,
		})

		return result.canConsume
	}
}

export default RemoteRouter
