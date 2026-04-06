export default async function (userId, groupId) {
	const GroupsModel = global.scylla.model("groups")
	const GroupMembershipsRefModel = global.scylla.model(
		"group_memberships_ref",
	)

	const group = await GroupsModel.findOne(
		{ _id: groupId },
		{
			raw: true,
		},
	)

	if (!group) {
		throw new Error("Group not found")
	}

	const memberships = await GroupMembershipsRefModel.find(
		{
			group_id: group._id,
		},
		{
			raw: true,
		},
	)

	const membership = memberships.find((member) => member.user_id === userId)

	if (!membership) {
		throw new Error("Cannot access this group")
	}

	return group
}
