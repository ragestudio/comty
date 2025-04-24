import { PostSave } from "@db_models"
import GetData from "./data"

export default async (payload = {}) => {
	let { user_id, page, limit } = payload

	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	let ids = await PostSave.find({ user_id })

	if (ids.length === 0) {
		return []
	}

	ids = ids.map((item) => item.post_id)

	return await GetData({
		page: page,
		limit: limit,
		for_user_id: user_id,
		query: {
			_id: {
				$in: ids,
			},
		},
	})
}
