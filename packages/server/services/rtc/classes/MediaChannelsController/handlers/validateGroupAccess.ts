import GroupsModel from "@db/groups"
import GroupMembershipsRefModel from "@db/group_memberships_ref"

export default async function (userId: string, groupId: string) {
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
