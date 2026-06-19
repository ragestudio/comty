import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
	{ limit, offset }: any = {},
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const query: any = {
		group_id: group_id,
	}
	const options: any = {}

	if (limit) {
		options.limit = parseInt(limit)
	}

	if (offset) {
		query.membership_id = {
			$lt: offset,
		}
	}

	const membershipsRef = await this.modelRef.find(query, limit)

	const users_ids = membershipsRef.map((ref) => ref.user_id)

	if (users_ids.length === 0) {
		return []
	}

	const memberships = await this.model.find({
		user_id: {
			$in: users_ids,
		},
		group_id: group_id,
	})

	return memberships
}
