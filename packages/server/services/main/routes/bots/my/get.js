import { Bot, User } from "@db_models"

export default {
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		const bots = await Bot.find({ owner_user_id: req.user_id })

		const users_ids = bots.map((bot) => bot.user_id)

		let users = await User.find({ _id: { $in: users_ids } })

		users = new Map(
			users.map((user) => [user._id.toString(), user.toObject()]),
		)

		return bots.map((bot) => {
			const user = users.get(bot.user_id)

			return {
				...bot.toObject(),
				user,
			}
		})
	},
}
