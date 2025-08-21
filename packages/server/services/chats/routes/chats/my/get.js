import { User, ChatMessage } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		// get recent messages
		// query messages sended to current user or from current user
		// must pick one message by user_id

		const current_user_id = req.auth.session.user_id

		let history = await ChatMessage.aggregate([
			{
				$match: {
					$or: [
						{ from_user_id: current_user_id },
						{ to_user_id: current_user_id },
					],
				},
			},
			{
				$sort: { created_at: -1 },
			},
			{
				$group: {
					_id: {
						$cond: [
							{ $eq: ["$from_user_id", current_user_id] },
							"$to_user_id",
							"$from_user_id",
						],
					},
					latestMessage: { $first: "$$ROOT" },
				},
			},
			{
				$replaceRoot: { newRoot: "$latestMessage" },
			},
		])

		if (history.length === 0) {
			return history
		}

		history = history.map((message) => {
			// chose an user_id that is not the `current_user_id`
			message.chat_user_id =
				message.from_user_id === current_user_id
					? message.to_user_id
					: message.from_user_id

			return message
		})

		// order by created_at
		history = history.sort((a, b) => {
			return new Date(b.created_at) - new Date(a.created_at)
		})

		const userData = await User.find({
			_id: {
				$in: history.map((message) => {
					return message.chat_user_id
				}),
			},
		})

		history = history.map((message) => {
			message.user = userData.find((user) => {
				return user._id.toString() === message.chat_user_id
			})

			return message
		})

		return history
	},
}
