import type API from "@services/main/main.service"
import User from "@db_models/user"
import Bot from "@db_models/bot"

export default defineRoute<API>()({
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		const bots = await Bot.find({ owner_user_id: req.user_id })

		const users_ids = bots.map((bot) => bot.user_id)

		const users = await User.find({ _id: { $in: users_ids } })

		const usersMap = new Map(
			users.map((user) => [user._id.toString(), user.toObject()]),
		)

		return bots.map((bot) => {
			const user = usersMap.get(bot.user_id)

			return {
				...bot.toObject(),
				user,
			}
		})
	},
})
