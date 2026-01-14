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

	const memberships = await this.model.findAsync(query)

	return memberships
}
