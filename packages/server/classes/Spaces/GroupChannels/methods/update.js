import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (group, channel_id, payload, user_id) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof channel_id !== "string") {
		throw new OperationError(400, "channel_id must be a string")
	}

	const channel = await this.get(group, channel_id)

	if (!channel) {
		throw new OperationError(404, "Channel not found")
	}

	if (typeof user_id === "string") {
		if (
			!(await GroupPermissions.canPerformAction(
				user_id,
				group,
				"MANAGE_CHANNELS",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to create a channel in this group",
			)
		}
	}

	if (payload.name && payload.name.length > 3) {
		channel.name = payload.name
	}

	if (payload.description) {
		channel.description = payload.description
	}

	if (payload.params) {
		channel.params = payload.params
	}

	await channel.saveAsync()

	return channel
}
