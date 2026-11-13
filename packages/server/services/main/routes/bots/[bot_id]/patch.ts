import type API from "@services/main/main.service"
import User from "@db_models/user"
import Bot from "@db_models/bot"

type RouteParams = {
	bot_id: string
}

type PatchBotBody = {
	public_name?: string
	avatar?: string
	cover?: string
	description?: string
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

		const user = await User.findOne({
			bot_id: bot._id,
		})

		const { public_name, avatar, cover, description } = (req.body ??
			{}) as PatchBotBody

		if (public_name) {
			user.public_name = public_name
		}

		if (avatar) {
			user.avatar = avatar
		}

		if (cover) {
			user.cover = cover
		}

		if (description) {
			user.description = description
		}

		await user.save()

		return bot
	},
})
