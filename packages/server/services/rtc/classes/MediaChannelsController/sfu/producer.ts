import type { AppData, MediaKind, RtpParameters } from "mediasoup/types"
import type { SfuProducerResult } from "@comty/shared/types/sfu/index"
import type { SFUNode } from "./node"

import { EventEmitter } from "tseep/lib/ee-safe"

export class RemoteRouterProducer extends EventEmitter {
	node: SFUNode
	id: string
	closed: boolean
	kind: MediaKind
	rtpParameters: RtpParameters
	appData: AppData

	observer = new EventEmitter()

	constructor(node: SFUNode, data: SfuProducerResult) {
		super()

		this.node = node
		this.id = data.id
		this.closed = false
		this.kind = data.kind
		this.rtpParameters = data.rtpParameters
		this.appData = data.appData ?? {}

		this.node.registerRemoteProducer(this)
	}

	close() {
		if (this.closed) return
		this.closed = true

		this.node.send("closeProducer", { producer_id: this.id })

		this._handleClosed()
	}

	_handleClosed() {
		this.node.unregisterRemoteProducer(this.id)
		this.emit("transportclose")
		this.observer.emit("close")
	}
}

export default RemoteRouterProducer
