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

		const bot = await Bot.findById(bot_id)

		if (!bot) {
			throw new OperationError(404, "Bot not found")
		}

		// check if is owner
		if (bot.owner_user_id !== req.user_id) {
			throw new OperationError(403, "You are not the owner of this bot")
		}

		await Bot.findByIdAndDelete(bot_id)
		await User.findOneAndDelete({ bot_id: bot_id })

		return { success: true, data: bot.toObject() }
	},
})
