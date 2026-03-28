export default async function (group_id, { limit, offset } = {}) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const query = {
		group_id: group_id,
	}

	if (limit) {
		query.$limit = parseInt(limit)
	}

	if (offset) {
		query._id = {
			$lt: offset,
		}
	}

	const membershipsRef = await this.modelRef.find({
		group_id: group_id,
	})

	const users_ids = membershipsRef.map((ref) => ref.user_id)

	const memberships = await this.model.find({
		user_id: {
			$in: users_ids,
		},
		group_id: group_id,
	})

	return memberships
}
