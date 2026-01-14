export default async function (group_id, membership_id) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (typeof membership_id !== "string") {
		throw new OperationError(400, "membership_id must be a string")
	}

	return await this.model.findOneAsync({
		group_id: group_id,
		_id: membership_id,
	})
}
