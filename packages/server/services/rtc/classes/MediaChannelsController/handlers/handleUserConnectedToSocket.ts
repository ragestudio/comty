import type MediaChannelsController from "../index"
import type { RtEngineContext } from "linebridge/classes/RtEngine/types"

export default async function (
	this: MediaChannelsController,
	ctx: RtEngineContext,
): Promise<null | void> {
	if (!ctx || !ctx.meta || !ctx.meta.user_id) {
		return null
	}

	// the event is cluster wide, only the node that owns the socket reacts
	if (ctx.node_id && ctx.node_id !== this.nodeId) {
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

	// only the watchers of this user receive the presence event
	await globalThis.websockets.senders.toTopic(
		`presence:user:${userId}`,
		"user:online",
		{
			userId: userId,
		},
	)
}
