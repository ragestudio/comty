export default async function (group, key) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof key !== "string") {
		throw new OperationError(400, "key must be provided")
	}

	const invite = await this.model.findOne({
		group_id: group._id.toString(),
		key: key,
	})

	if (!invite) {
		throw new OperationError(404, "Invite not found")
	}

	await invite.delete()

	return invite.toRaw()
}
