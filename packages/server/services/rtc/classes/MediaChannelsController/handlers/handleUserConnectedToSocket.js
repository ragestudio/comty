export default async function (userId) {
	if (!userId) {
		return
	}

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
