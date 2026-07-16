import type Groups from "../index"

export default async function (
	this: typeof Groups,
	group_id: string,
	{ raw = true }: any = {},
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const group = await this.model.findOne(
		{
			_id: group_id,
		},
		{
			raw: raw,
		},
	)

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	return group
}
