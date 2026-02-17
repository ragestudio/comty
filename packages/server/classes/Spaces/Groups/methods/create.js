import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default async function (payload) {
	if (!payload.name || payload.name.length < 3) {
		throw new OperationError(400, "Group `name` is missing or too short")
	}

	const groupId = global.snowflake.nextId().toString()
	const created_at = new Date().toISOString()

	const group = new this.model({
		_id: groupId,
		name: payload.name,
		description: payload.description,
		icon: payload.icon,
		cover: payload.cover,
		owner_user_id: payload.owner_user_id,
		reachability: payload.reachability,
		created_at: created_at,
	})

	await group.saveAsync()

	// create the membership
	await GroupMemberships.create(payload.owner_user_id, groupId)

	// create the general text channel
	await GroupChannels.create(
		groupId,
		{
			kind: "chat",
			name: "General",
		},
		payload.owner_user_id,
	)

	return group.toJSON()
}
