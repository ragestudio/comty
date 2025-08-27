import { Bot, User } from "@db_models"

export default {
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		const bot = await Bot.findById(req.params.bot_id)

		if (!bot) {
			throw new OperationError(404, "Bot not found")
		}

		// check if is owner
		if (bot.owner_user_id !== req.user_id) {
			throw new OperationError(403, "You are not the owner of this bot")
		}

		await Bot.findByIdAndDelete(req.params.bot_id)
		await User.findOneAndDelete({ bot_id: req.params.bot_id })

		return { success: true, data: bot.toObject() }
	},
}
