import { Bot, User } from "@db_models"

export default class BotToken {
	static async validate(token) {
		let result = {
			valid: false,
			error: null,
		}

		if (typeof token !== "string") {
			result.valid = false
			result.error = "Token is missing or not a string"

			return result
		}

		const bot = await Bot.findOne({ token: token })

		if (!bot) {
			result.valid = false
			result.error = "Cannot find a bot with this token"

			return result
		}

		result.valid = true
		result.data = bot.toObject()
		result.user = async () => {
			return await User.findOne({ bot_id: bot._id.toString() })
		}
		result.owner = async () => {
			return await User.findOne({ _id: bot.owner_user_id })
		}

		return result
	}
}
