import { RTCClient } from "@services/rtc/types"
import type MediaChannelsController from "../index"

export default async function (
	this: MediaChannelsController,
	client: RTCClient,
): Promise<string | void> {
	try {
		// get current channel from cache
		const currentChannelId = await this.users.get(client.userId)

		if (!currentChannelId) {
			return
		}

		const channelInstance = await this.getInstance(currentChannelId, client)

		if (!channelInstance) {
			return
		}

		// cancel any pending disconnect timeout
		this.cancelPendingDisconnect(client.userId)

		// clean cache
		await this.users.remove(client.userId, currentChannelId)

		// Leave channel
		await channelInstance.leaveClient(client, {
			emitEventToSelf: true,
		})

		return channelInstance.channelId
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
