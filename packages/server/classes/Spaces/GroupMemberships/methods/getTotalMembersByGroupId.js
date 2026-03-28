export default async function (group_id) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const membershipsRefs = await this.modelRef.find({
		group_id: group_id,
	})

	return membershipsRefs.length
}
