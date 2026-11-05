import type MediaChannelsController from ".."
import type { RTCClient } from "@services/rtc/types"

/**
 * Removes a user from the channel it is currently in, running on the owner
 * when the channel lives on another node. Used by the disconnect grace
 * period, where there is no socket available.
 */
export default async function (
	this: MediaChannelsController,
	userId: string,
): Promise<void> {
	const channelId = await this.users.get(userId)

	if (!channelId) return

	const owner = await this.ownership.resolve(channelId)

	if (owner && owner.node_id !== this.nodeId) {
		await this.requestToChannelOwner(owner.node_id, {
			target: "controller",
			method: "leaveUser",
			args: [userId],
		})

		return
	}

	const channel = await this.getInstance(channelId)

	if (!channel) {
		await this.users.remove(userId, channelId)

		return
	}

	await this.users.remove(userId, channelId)
	await channel.leaveClient({ userId } as RTCClient)
}
