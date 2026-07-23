import type { RtpCapabilities } from "mediasoup/types"
import type { SFUNode } from "./node"

import { EventEmitter } from "tseep/lib/ee-safe"
import { RemoteRouterProducer } from "./producer"
import { RemoteRouterConsumer } from "./consumer"

export class RemoteRouterTransport extends EventEmitter {
	node: SFUNode
	id: string
	closed: boolean
	iceParameters: any
	iceCandidates: any
	dtlsParameters: any
	appData: any

	constructor(node: SFUNode, data: any) {
		super()

		this.node = node
		this.id = data.id
		this.closed = false
		this.iceParameters = data.iceParameters
		this.iceCandidates = data.iceCandidates
		this.dtlsParameters = data.dtlsParameters
		this.appData = data.appData ?? {}

		this.node.registerRemoteTransport(this)
	}

	async connect({ dtlsParameters }: { dtlsParameters: any }) {
		await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"connectTransport",
			{
				transport_id: this.id,
				dtlsParameters,
			},
		)
	}

	async produce({
		kind,
		rtpParameters,
		appData,
	}: {
		kind: string
		rtpParameters: any
		appData?: any
	}) {
		const response = await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"produce",
			{
				transport_id: this.id,
				kind,
				rtpParameters,
				appData,
			},
		)

		return new RemoteRouterProducer(this.node, response)
	}

	async consume({
		producerId,
		rtpCapabilities,
		paused = false,
	}: {
		producerId: string
		rtpCapabilities: RtpCapabilities
		paused?: boolean
	}) {
		const response = await this.node.ipc.requestToNode(
			this.node.node_id.toString(),
			"consume",
			{
				transport_id: this.id,
				producerId,
				rtpCapabilities,
				paused,
			},
		)

		return new RemoteRouterConsumer(this.node, response)
	}

	close() {
		if (this.closed) return

		this.closed = true

		this.node.ipc.sendToNode(
			this.node.node_id.toString(),
			"closeTransport",
			{ transport_id: this.id },
		)

		this.node.unregisterRemoteTransport(this.id)
		this.emit("@close")
	}

	_emitSfuEvent(event: string, ...args: any[]) {
		this.emit(event, ...args)
	}
}

export default RemoteRouterTransport
