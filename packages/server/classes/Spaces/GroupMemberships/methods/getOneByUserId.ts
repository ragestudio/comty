import type GroupMemberships from ".."

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
	user_id: string,
) {
	const membership = await this.model.find(
		{
			user_id,
			group_id,
		},
		{
			limit: 1,
		},
	)

	if (!membership[0]) return null

	return membership[0]
}
