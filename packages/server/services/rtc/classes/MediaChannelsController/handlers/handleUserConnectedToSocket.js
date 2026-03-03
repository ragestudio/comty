export default async function (ctx) {
	if (!ctx || !ctx.meta || !ctx.meta.user_id) {
		return null
	}

	const userId = ctx.meta.user_id

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
