import { User, ChatMessage } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const { limit = 50, offset = 0, order = "asc" } = req.query

		const [from_user_id, to_user_id] = [
			req.auth.session.user_id,
			req.params.to_user_id,
		]

		const query = {
			from_user_id: {
				$in: [from_user_id, to_user_id],
			},
			to_user_id: {
				$in: [from_user_id, to_user_id],
			},
		}

		let users_data = await User.find({
			_id: [from_user_id, to_user_id],
		})

		users_data = users_data.map((user) => {
			user = user.toObject()

			if (!user) {
				return {
					_id: 0,
					username: "Deleted User",
				}
			}

			user._id = user._id.toString()

			return user
		})

		let history = await ChatMessage.find(query)
			.sort({ created_at: order === "desc" ? -1 : 1 })
			.skip(offset)
			.limit(limit)

		history = history.map(async (item) => {
			item = item.toObject()

			item.user = users_data.find((user) => {
				return user._id === item.from_user_id
			})

			return item
		})

		history = await Promise.all(history)

		return {
			total: await ChatMessage.countDocuments(query),
			offset: offset,
			limit: limit,
			order: order,
			list: history,
		}
	},
}
