export default async function (userId) {
	try {
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

		// check if this userId is connected to any channel
		const currentUserChannel = this.usersMap.get(userId)

		// if there is a channel, leave it
		if (currentUserChannel) {
			const channel = this.instances.get(currentUserChannel)

			await channel.leaveClient({
				userId: userId,
			})
		}
	} catch (error) {
		console.error("Error handling user disconnection:", error)
	}
}
