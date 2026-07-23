import type { SFUNode } from "./node"
import type { IPC_CloseRouterPayload } from "@comty/shared/types/rtc"
import type { RtpCapabilities } from "mediasoup/types"

import RemoteRouterTransport from "./transport"

export class RemoteRouter {
	node: SFUNode
	id: string
	closed: boolean
	rtpCapabilities: RtpCapabilities

	constructor(node: SFUNode, data: any) {
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

		this.node.ipc.sendToNode(this.node.node_id.toString(), "closeRouter", {
			id: this.id,
		} as IPC_CloseRouterPayload)
	}

	async createWebRtcTransport() {
		const response = await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"createRouterWebRtcTransport",
			{ router_id: this.id },
		)

		return new RemoteRouterTransport(this.node, response)
	}

	async canConsume({
		producerId,
		rtpCapabilities,
	}: {
		producerId: string
		rtpCapabilities: RtpCapabilities
	}) {
		return (await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"routerCanConsume",
			{
				router_id: this.id,
				producerId,
				rtpCapabilities,
			},
		)) as boolean
	}
}

export default RemoteRouter
