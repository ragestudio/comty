import type Groups from "../index"

export default async function (this: typeof Groups, group_ids: string[]) {
	if (!Array.isArray(group_ids)) {
		throw new OperationError(400, "group_ids must be an array")
	}

	let groups = await this.model.find(
		{
			_id: {
				$in: group_ids,
			},
		},
		{
			raw: true,
		},
	)

	return groups
}
