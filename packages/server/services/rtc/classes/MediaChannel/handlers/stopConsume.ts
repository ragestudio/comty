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

		// handles both live consumers and restored serialized entries
		await this.closeConsumerEntry(client.userId, consumer_id)
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error stopping consumer for ${client.userId}:`,
			error,
		)
		throw error
	}
}

export default stopConsumeHandler
