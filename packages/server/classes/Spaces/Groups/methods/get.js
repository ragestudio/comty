export default async function (group_id, { raw = true } = {}) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const group = await this.model.findOneAsync(
		{
			_id: group_id,
		},
		{
			raw: raw,
		},
	)

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	return group
}
