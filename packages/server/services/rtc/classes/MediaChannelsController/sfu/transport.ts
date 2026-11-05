import type {
	AppData,
	DtlsParameters,
	MediaKind,
	RtpCapabilities,
	RtpParameters,
} from "mediasoup/types"
import type { SfuTransportDump } from "@comty/shared/types/sfu/index"
import type { SFUNode } from "./node"

import { EventEmitter } from "tseep/lib/ee-safe"
import { RemoteRouterProducer } from "./producer"
import { RemoteRouterConsumer } from "./consumer"

export class RemoteRouterTransport extends EventEmitter {
	node: SFUNode
	id: string
	closed: boolean
	iceParameters: SfuTransportDump["iceParameters"]
	iceCandidates: SfuTransportDump["iceCandidates"]
	dtlsParameters: SfuTransportDump["dtlsParameters"]

	/**
	 * A restored transport only needs its id, the media session lives on the
	 * sfu node and every operation is routed by it.
	 */
	constructor(
		node: SFUNode,
		data: Pick<SfuTransportDump, "id"> & Partial<SfuTransportDump>,
	) {
		super()

		this.node = node
		this.id = data.id
		this.closed = false
		this.iceParameters = data.iceParameters
		this.iceCandidates = data.iceCandidates
		this.dtlsParameters = data.dtlsParameters

		this.node.registerRemoteTransport(this)
	}

	async connect({ dtlsParameters }: { dtlsParameters: DtlsParameters }) {
		await this.node.request("connectTransport", {
			transport_id: this.id,
			dtlsParameters,
		})
	}

	async produce({
		kind,
		rtpParameters,
		appData,
	}: {
		kind: MediaKind
		rtpParameters: RtpParameters
		appData?: AppData
	}) {
		const response = await this.node.request("produce", {
			transport_id: this.id,
			kind,
			rtpParameters,
			appData,
		})

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
		const response = await this.node.request("consume", {
			transport_id: this.id,
			producerId,
			rtpCapabilities,
			paused,
		})

		return new RemoteRouterConsumer(this.node, response)
	}

	close() {
		if (this.closed) return

		this.closed = true

		this.node.send("closeTransport", { transport_id: this.id })

		this.node.unregisterRemoteTransport(this.id)
		this.emit("@close")
	}

	_emitSfuEvent(event: string, ...args: any[]) {
		this.emit(event, ...args)
	}
}

export default RemoteRouterTransport
