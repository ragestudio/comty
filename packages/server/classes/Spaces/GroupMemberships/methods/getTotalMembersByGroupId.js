export default async function (group_id) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const reg = await this.modelCounter.findOne({
		group_id: group_id,
	})

	if (reg?.counter) {
		return parseInt(reg.counter)
	}

	return 0
}
