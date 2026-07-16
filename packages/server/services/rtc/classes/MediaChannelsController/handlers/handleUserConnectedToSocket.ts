import type MediaChannelsController from "../index"
import type { ConnectionContext } from "../types"

export default async function (
	this: MediaChannelsController,
	ctx: ConnectionContext,
): Promise<null | void> {
	if (!ctx || !ctx.meta || !ctx.meta.user_id) {
		return null
	}

	const userId = ctx.meta.user_id

	// cancel any pending disconnect
	this.cancelPendingDisconnect(userId)

	// get all groups that is member
	const groupsIds = await this.getUserJoinedGroupsIds(userId)

	for (const id of groupsIds) {
		const groupTopic = `group:${id}`

		await globalThis.websockets.senders.toTopic(
			groupTopic,
			`${groupTopic}:user:online`,
			{
				userId: userId,
			},
		)
	}
}
