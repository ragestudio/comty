import Groups from "@shared-classes/Spaces/Groups"

export default async function (membership_id, group_id) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const group = await Groups.model.findOneAsync({
		_id: group_id,
	})

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	const membership = await this.model.findOneAsync({
		_id: membership_id,
	})

	await membership.deleteAsync()

	return membership
}
