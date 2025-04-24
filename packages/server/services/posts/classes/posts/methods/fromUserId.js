import GetData from "./data"

export default async (payload = {}) => {
	const { for_user_id, user_id, page, limit } = payload

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	return await GetData({
		for_user_id: for_user_id,
		page: page,
		limit: limit,
		query: {
			user_id: {
				$in: user_id,
			},
		},
	})
}
