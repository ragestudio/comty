import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	user_id: string,
	{ limit, offset }: any = {},
) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	const query: any = {
		user_id: user_id,
	}
	const options: any = {}

	if (limit) {
		options.limit = parseInt(limit)
	}

	if (offset) {
		query._id = {
			$lt: offset,
		}
	}

	const memberships = await this.model.find(query, options)

	return memberships
}
