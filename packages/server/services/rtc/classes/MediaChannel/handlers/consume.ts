import type { MediaChannel } from ".."
import type { RTCClient } from "@services/rtc/types"

import setFind from "@shared-utils/setFind"

export type ConsumePayload = {
	producerId: string
	transportId: string
	rtpCapabilities: any
	paused: boolean
}

async function consumeHandler(
	this: MediaChannel,
	client: RTCClient,
	payload: ConsumePayload,
) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			throw new Error("Client not in channel")
		}

		const { producerId, transportId, rtpCapabilities, paused } = payload

		if (!producerId || !transportId || !rtpCapabilities) {
			throw new Error("Missing required parameters")
		}

		const transport = clientInst.transports?.get(transportId)

		if (!transport) {
			throw new Error("Transport not found")
		}

		const canConsume = await this.router.canConsume({
			producerId,
			rtpCapabilities,
		})

		if (!canConsume) {
			throw new Error("Cannot consume")
		}

		const consumer = await transport.consume({
			producerId,
			rtpCapabilities,
			paused: paused ?? false,
		})

		// Store consumer
		if (!this.consumers.has(client.userId)) {
			this.consumers.set(client.userId, [])

			if (this.controller) {
				this.controller.markInstanceDirty(this.channelId)
			}
		}

		this.consumers.get(client.userId).push(consumer)

		this._setupConsumerEvents(consumer, clientInst)

		if (this.controller) {
			this.controller.markInstanceDirty(this.channelId)
		}

		return {
			id: consumer.id,
			producerId: producerId,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
		}
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error consuming for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default consumeHandler
