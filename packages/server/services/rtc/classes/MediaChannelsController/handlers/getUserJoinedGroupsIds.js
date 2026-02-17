export default async function (userId) {
	const GroupMembershipsModel = global.scylla.model("group_memberships")

	const memberships = await GroupMembershipsModel.findAsync(
		{
			user_id: userId,
		},
		{
			raw: true,
		},
	)

	return memberships.map((membership) => membership.group_id)
}
