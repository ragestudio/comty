import { Bot, User } from "@db_models"

export default {
	useMiddlewares: ["withAuth"],
	fn: async (req) => {
		const {
			username,
			public_name,
			avatar = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Christian",
		} = req.body

		if (!username) {
			throw new OperationError(400, "username is required")
		}

		let bot = new Bot({
			owner_user_id: req.user_id,
			token: nanoid(48),
			created_at: new Date(),
		})

		let user = new User({
			username: username,
			public_name: public_name,
			avatar: avatar,
			roles: ["bot"],
			created_at: new Date().getTime(),
			bot: true,
			bot_id: bot._id.toString(),
		})

		bot.user_id = user._id.toString()

		await user.save()
		await bot.save()

		return { ...bot.toObject(), user: user.toObject() }
	},
}
