import type { RTCClient } from "@services/rtc/types"
import type { MediaChannel } from "."

import setFind from "@shared-utils/setFind"

export type RebindResult = {
	ok: boolean
	channelId?: string
	started_at?: Date
	clients?: any[]
	producers?: any[]
}

export default function rebindClient(
	this: MediaChannel,
	nextClient: RTCClient,
): RebindResult {
	const currentClient = setFind(
		this.clients,
		(client) => client.userId === nextClient.userId,
	)

	if (!currentClient) return { ok: false }

	// a reconstructed client (service restart or remote instance) has no
	// transports, the media session cannot be preserved
	if (currentClient.staled) return { ok: false }
	if (!currentClient.transports || currentClient.transports.size === 0) {
		return { ok: false }
	}

	const target = currentClient as any
	const source = nextClient as any

	// remote clients are routed by their nats headers, local ones by socket
	if (source.headers) target.headers = source.headers
	if (source.socket) target.socket = source.socket
	if (source.context) target.context = source.context

	target.staled = false

	if (this.controller) {
		this.controller.markInstanceDirty(this.channelId)
	}

	return {
		ok: true,
		channelId: this.channelId,
		started_at: this.started_at,
		clients: this.getConnectedClientsSerialized(),
		producers: this.getProducersSerialized(),
	}
}
