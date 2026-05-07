export default async function (user_id, { limit, offset } = {}) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	const query = {
		user_id: user_id,
	}
	const options = {}

	if (limit) {
		options.limit = parseInt(limit)
	}

	if (offset) {
		query._id = {
			$lt: offset,
		}
	}

	const memberships = await this.model.find(query, options)

	return memberships
}
