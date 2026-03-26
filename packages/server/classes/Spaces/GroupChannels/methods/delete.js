import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (group, channel_id, user_id) {
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

	await channel.deleteAsync()

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:channel:deleted`,
				channel.toJSON(),
			)
		} catch (error) {
			console.error("Failed to send event to group topic", error)
		}
	}

	return channel
}
