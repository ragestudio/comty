import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
	{
		limit,
		offset,
		raw,
	}: { limit?: number | string; offset?: string; raw?: boolean } = {},
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const query: any = {
		group_id: group_id,
	}
	const options: Record<string, unknown> = {}

	if (typeof limit === "string") {
		options.limit = parseInt(limit)
	} else if (typeof limit === "number" && !isNaN(limit)) {
		options.limit = limit
	}

	if (offset) {
		query.membership_id = {
			$lt: offset,
		}
	}

	const membershipsRef = await this.modelRef.find(query, options.limit)

	const users_ids = membershipsRef.map((ref) => ref.user_id)

	if (users_ids.length === 0) {
		return []
	}

	return await this.model.find(
		{
			user_id: {
				$in: users_ids,
			},
			group_id: group_id,
		},
		{
			raw: raw,
		},
	)
}
