export default async function (user_id, sortArr) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	if (!Array.isArray(sortArr)) {
		throw new OperationError(
			400,
			"Must be a Array of strings `Array[<string>]`",
		)
	}

	await this.sortModel.update(
		{
			user_id: user_id,
		},
		{
			order: sortArr,
		},
	)

	return sortArr
}
