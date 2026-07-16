import GroupMembershipsModel from "@db/group_memberships"

export default async function (userId: string): Promise<string[]> {
	const memberships = await GroupMembershipsModel.find(
		{
			user_id: userId,
		},
		{
			raw: true,
		},
	)

	return memberships.map((membership) => membership.group_id)
}
