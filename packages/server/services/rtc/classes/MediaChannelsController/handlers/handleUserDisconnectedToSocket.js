export default async function (userId) {
	if (!userId) {
		return
	}

	// check if there is not a client with this userId
	const clients = await global.websockets.find.clientsByUserId(userId)

	if (clients.length > 0) {
		return null
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
