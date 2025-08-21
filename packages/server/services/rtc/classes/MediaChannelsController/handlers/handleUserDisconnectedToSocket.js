export default async function (userId) {
	if (!userId) {
		return
	}

	// get all groups that is member
	const groupsIds = await this.getUserJoinedGroupsIds(userId)

	for (const id of groupsIds) {
		this.dispatchGroupStateUpdate({
			groupId: id,
			event: "user:offline",
			payload: {
				userId: userId,
			},
		})
	}
}
