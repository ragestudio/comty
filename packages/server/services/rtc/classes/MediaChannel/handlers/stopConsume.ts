import type { MediaChannel } from ".."
import type { RTCClient } from "@services/rtc/types"

export type StopConsumePayload = {
	consumer_id: string
}

async function stopConsumeHandler(
	this: MediaChannel,
	client: RTCClient,
	payload: StopConsumePayload,
) {
	try {
		const { consumer_id } = payload

		if (!consumer_id) {
			throw new Error("Missing consumer_id")
		}

		const userConsumers = this.consumers.get(client.userId)

		if (!userConsumers) {
			return
		}

		const consumerIndex = userConsumers.findIndex(
			(c) => c.id === consumer_id,
		)

		if (consumerIndex !== -1) {
			const consumer = userConsumers[consumerIndex]
			
			// Close the remote consumer (which triggers IPC close to SFU node)
			consumer.close()

			// Remove from channel consumers array
			userConsumers.splice(consumerIndex, 1)

			if (this.controller) {
				this.controller.markInstanceDirty(this.channelId)
			}
		}
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error stopping consumer for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default stopConsumeHandler
