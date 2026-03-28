export default async function (group_id, user_id, membership_id) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (typeof membership_id !== "string") {
		throw new OperationError(400, "membership_id must be a string")
	}

	return await this.model.findOne({
		user_id: user_id,
		group_id: group_id,
		_id: membership_id,
	})
}
