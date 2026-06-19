import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	user_id: string,
	group_id: string,
) {
	const membership = await this.model.find(
		{
			user_id: user_id,
			group_id: group_id,
		},
		{
			raw: true,
		},
	)

	return membership.length !== 0
}
