export default async function (group_id, user_id) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be provided")
	}

	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	// check if is already a member
	if (await this.isUserIdOnMembers(user_id, group_id)) {
		throw new OperationError(400, "User is already a member")
	}

	const _id = global.snowflake.nextId().toString()
	const created_at = new Date().toISOString()

	const membership = new this.model({
		_id: _id,
		user_id: user_id,
		group_id: group_id,
		created_at: created_at,
	})

	await membership.saveAsync()

	return membership.toJSON()
}
