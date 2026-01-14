export default async function (user_id, { limit, offset } = {}) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	const query = {
		user_id: user_id,
	}

	if (limit) {
		query.$limit = parseInt(limit)
	}

	if (offset) {
		query._id = {
			$lt: offset,
		}
	}

	const memberships = await this.model.findAsync(query)

	return memberships
}
