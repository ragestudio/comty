import { Bot, User } from "@db_models"

export default {
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		let bot = await Bot.findById(req.params.bot_id)

		if (!bot) {
			throw new OperationError(404, "Bot not found")
		}

		if (bot.owner_user_id.toString() === req.user_id) {
			bot = await Bot.findById(req.params.bot_id).select("+token")
		}

		const user = await User.findOne({ bot_id: req.params.bot_id })

		if (!user) {
			throw new OperationError(404, "Bot user not found")
		}

		return {
			...bot.toObject(),
			user: user.toObject(),
		}
	},
}
