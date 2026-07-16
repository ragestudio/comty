import { RTCClient } from "@services/rtc/types"
import type MediaChannelsController from "../index"

export default async function (
	this: MediaChannelsController,
	client: RTCClient,
): Promise<string | void> {
	try {
		const currentUserMediaChannel = this.usersMap.get(client.userId)

		if (!currentUserMediaChannel) {
			return
		}

		const channelInstance = this.instances.get(currentUserMediaChannel)

		if (!channelInstance) {
			return
		}

		// cancel any pending disconnect timeout
		this.cancelPendingDisconnect(client.userId)

		// delete user from client list
		this.usersMap.delete(client.userId)

		// Leave channel
		await channelInstance.leaveClient(client, {
			emitEventToSelf: true,
		})

		return channelInstance.channelId
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
