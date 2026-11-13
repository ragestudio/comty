import type API from "@services/main/main.service"
import User from "@db_models/user"
import Bot from "@db_models/bot"

type RouteParams = {
	bot_id: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		const { bot_id } = req.params as RouteParams

		let bot = await Bot.findById(bot_id)

		if (!bot) {
			throw new OperationError(404, "Bot not found")
		}

		if (bot.owner_user_id.toString() === req.user_id) {
			bot = await Bot.findById(bot_id).select("+token")
		}

		const user = await User.findOne({ bot_id: bot_id })

		if (!user) {
			throw new OperationError(404, "Bot user not found")
		}

		return {
			...bot.toObject(),
			user: user.toObject(),
		}
	},
})
