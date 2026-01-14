import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (group, user_id) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof user_id === "string") {
		// check if the user is allowed to read the channel
		if (
			!(await GroupPermissions.canPerformAction(
				user_id,
				group,
				"READ_CHANNELS",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to view channels",
			)
		}
	}

	let channels = await this.model.findAsync({
		group_id: group._id,
	})

	return channels
}
