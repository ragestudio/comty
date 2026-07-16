import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import type { Group } from "@db/groups"
import type GroupChannels from "../index"

export default async function (
	this: typeof GroupChannels,
	group: Group,
	channel_id: string,
	user_id?: string,
) {
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

	await channel.delete()

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:channel:deleted`,
				channel.toRaw(),
			)
		} catch (error) {
			console.error("Failed to send event to group topic", error)
		}
	}

	return channel
}
