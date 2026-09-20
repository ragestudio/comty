import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
	membership_id: string,
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const ref = await this.modelRef.find(
		{
			group_id: group_id,
			membership_id: membership_id,
		},
		{
			raw: true,
			limit: 1,
		},
	)

	if (!ref[0]) {
		return null
	}

	return await this.model.findOne({
		_id: membership_id,
		group_id: group_id,
		user_id: ref[0].user_id,
	})
}
