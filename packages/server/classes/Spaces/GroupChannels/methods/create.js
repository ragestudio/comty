import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (group, payload, user_id) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (!payload.name || payload.name.length < 3) {
		throw new OperationError(400, "Channel `name` is missing or too short")
	}

	if (typeof payload.kind !== "string") {
		throw new OperationError(400, "Channel `kind` is missing")
	}

	if (!this.kinds[payload.kind]) {
		throw new OperationError(400, "Channel `kind` is not valid")
	}

	// if user_id is provided, check if the user has permissions to create a channel
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

	const channelId = global.snowflake.nextId().toString()
	const created_at = new Date().toISOString()

	const channel = new this.model({
		_id: channelId,
		group_id: group._id,
		kind: payload.kind,
		name: payload.name,
		description: payload.description,
		params: payload.params,
		created_at: created_at,
	})

	await channel.saveAsync()

	return channel.toJSON()
}
