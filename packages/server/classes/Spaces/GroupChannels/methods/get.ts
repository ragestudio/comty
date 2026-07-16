import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import GroupChannelsModel from "@db/group_channels"
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

	const channel = await GroupChannelsModel.findOne({
		group_id: group._id,
		_id: channel_id,
	})

	if (!channel) {
		throw new OperationError(404, "Channel not found")
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
				"You are not allowed to read this channel",
			)
		}
	}

	return channel
}
