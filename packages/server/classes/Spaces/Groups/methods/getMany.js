export default async function (group_ids) {
	if (!Array.isArray(group_ids)) {
		throw new OperationError(400, "group_ids must be an array")
	}

	let groups = await this.model.findAsync(
		{
			_id: {
				$in: group_ids,
			},
		},
		{
			raw: true,
		},
	)

	return groups
}
