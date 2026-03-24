import Groups from "@shared-classes/Spaces/Groups"

export default async function (membership_id, group_id, group) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (!group) {
		group = await Groups.model.findOneAsync({
			_id: group_id,
		})
	}

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	const membership = await this.model.findOneAsync({
		group_id: group_id,
		_id: membership_id,
	})

	await membership.deleteAsync()

	if (global.websockets && membership.user_id) {
		try {
			global.websockets.senders.toUserId(
				membership.user_id,
				"groups:membership:deleted",
				{
					membership_id: membership_id,
					group_id: group_id,
				},
			)
		} catch (error) {
			console.error(
				"Failed to send (groups:membership:deleted) to user",
				error,
			)
		}
	}

	return membership
}
