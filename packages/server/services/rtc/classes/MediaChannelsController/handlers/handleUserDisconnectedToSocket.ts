import type MediaChannelsController from "../index"
import type { ConnectionContext } from "../types"

const GRACE_PERIOD_MS = 15000

export default async function (
	this: MediaChannelsController,
	ctx: ConnectionContext,
): Promise<null | void> {
	if (!ctx || !ctx.meta || !ctx.meta.user_id) {
		return null
	}

	const userId = ctx.meta.user_id

	try {
		// check if there are other connections for this userId
		const clients = await global.websockets.find.clientsByUserId(userId)

		if (clients.length > 0) {
			// user still has other connections, dont start grace period
			return null
		}

		// get all groups that is member
		const groupsIds = await this.getUserJoinedGroupsIds(userId)

		for (const id of groupsIds) {
			const groupTopic = `group:${id}`

			await globalThis.websockets.senders.toTopic(
				groupTopic,
				`${groupTopic}:user:offline`,
				{
					userId: userId,
				},
			)
		}

		// check if this userId is connected to any channel
		const channelId = this.usersMap.get(userId)

		if (!channelId) {
			return null
		}

		// if already has a pending disconnect timeout, skip
		if (this.pendingDisconnectsTimeout.has(userId)) {
			return null
		}

		console.log(
			`[media-channels] User ${userId} disconnected from channel ${channelId}, starting ${GRACE_PERIOD_MS}ms grace period`,
		)

		const timeout = setTimeout(async () => {
			this.pendingDisconnectsTimeout.delete(userId)

			const channel = this.instances.get(channelId)

			if (channel && channel.leaveClient) {
				console.log(
					`[media-channels] Grace period expired for user ${userId}, leaving channel`,
				)

				this.usersMap.delete(userId)

				await channel.leaveClient({
					userId: userId,
				})
			}
		}, GRACE_PERIOD_MS)

		this.pendingDisconnectsTimeout.set(userId, { timeout, channelId })
	} catch (error) {
		console.error("Error handling user disconnection:", error)
	}
}
