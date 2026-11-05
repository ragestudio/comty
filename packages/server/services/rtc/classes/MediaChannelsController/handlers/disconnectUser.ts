import type MediaChannelsController from ".."
import type MediaChannel from "@classes/MediaChannel"

/**
 * Removes a user from a voice channel, running on the owner node when the
 * channel lives elsewhere. Used by the moderator disconnect endpoint.
 */
export default async function (
	this: MediaChannelsController,
	channelId: string,
	userId: string,
) {
	const owner = await this.ownership.resolve(channelId)

	if (owner && owner.node_id !== this.nodeId) {
		return await this.requestToChannelOwner(owner.node_id, {
			target: "controller",
			method: "disconnectUser",
			args: [channelId, userId],
		})
	}

	const resolved = await this.getInstance(channelId)

	if (!resolved || (resolved as any).is_remote) {
		throw new OperationError(404, "Channel not found")
	}

	const channel = resolved as MediaChannel
	const client = Array.from(channel.clients).find(
		(item) => item.userId === userId,
	)

	if (!client) {
		throw new OperationError(404, "Client not found with this user id")
	}

	await channel.leaveClient(client, { emitEventToSelf: true })

	return {
		ok: true,
		user_id: userId,
		channel_id: channelId,
	}
}
