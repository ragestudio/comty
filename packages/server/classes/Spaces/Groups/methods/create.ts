import GroupsModel from "@db/groups"

import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"
import type Groups from "../index"

export default async function (this: typeof Groups, payload: any) {
	if (!payload.name || payload.name.length < 3) {
		throw new OperationError(400, "Group `name` is missing or too short")
	}

	const groupId = global.snowflake.nextId().toString()
	const created_at = new Date()

	const group = GroupsModel.obj({
		__v: 0,
		_id: groupId,
		name: payload.name,
		description: payload.description,
		icon: payload.icon,
		cover: payload.cover,
		owner_user_id: payload.owner_user_id,
		reachability: payload.reachability,
		created_at: created_at,
	})

	await group.save()

	// create the membership
	await GroupMemberships.create(groupId, payload.owner_user_id)

	// create the general text channel
	await GroupChannels.create(
		group,
		{
			kind: "chat",
			name: "General",
		},
		payload.owner_user_id,
	)

	return group.toRaw()
}
