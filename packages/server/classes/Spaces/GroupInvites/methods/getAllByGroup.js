export default async function (group) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	const invites = await this.model.findAsync(
		{
			group_id: group._id.toString(),
		},
		{
			raw: true,
		},
	)

	return invites
}
