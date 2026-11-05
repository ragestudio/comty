import type { RTCClient } from "@services/rtc/types"

export type StopProducePayload = {
	producerId: string
}

async function stopProduceHandler(
	this: any,
	client: RTCClient,
	payload: StopProducePayload,
) {
	try {
		const { producerId } = payload

		const userProducers = this.producers.get(client.userId)

		if (!userProducers || !userProducers.has(producerId)) {
			// Producer doesn't exist or already closed
			return { success: true }
		}

		// handles both live producers and restored serialized entries
		await this.closeProducerEntry(client.userId, producerId)

		return { success: true }
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error stopping production for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default stopProduceHandler
