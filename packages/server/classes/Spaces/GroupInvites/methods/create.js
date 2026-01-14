export default async function (group, payload) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof payload !== "object") {
		throw new OperationError(400, "payload must be provided")
	}

	if (!payload.issuer_user_id) {
		throw new OperationError(400, "issuer_user_id must be provided")
	}

	const invite = new this.model({
		group_id: group._id.toString(),
		key: nanoid(),
		issuer_user_id: payload.issuer_user_id,
		max_usage: parseInt(payload.max_usage) ?? 5,
		created_at: new Date().toISOString(),
	})

	await invite.saveAsync()

	return invite.toJSON()
}
