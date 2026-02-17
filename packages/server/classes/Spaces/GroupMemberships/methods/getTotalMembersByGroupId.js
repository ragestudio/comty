export default async function (group_id) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const memberships = await this.model.findAsync({
		group_id: group_id,
	})

	return memberships.length
}
