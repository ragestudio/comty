import { UserChat } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const current_user_id = req.auth.session.user_id
		const target_user_id = req.params.to_user_id

		let chat = await UserChat.findOne({
			$or: [
				{
					"user_1._id": current_user_id,
					"user_2._id": target_user_id,
				},
				{
					"user_1._id": target_user_id,
					"user_2._id": current_user_id,
				},
			],
		})

		if (!chat) {
			return {
				exists: false,
				encryptedKey: null,
			}
		}

		let encryptedKey = null

		if (chat.user_1._id === current_user_id) {
			encryptedKey = chat.user_1.key
		}

		if (chat.user_2._id === current_user_id) {
			encryptedKey = chat.user_2.key
		}

		return {
			exists: !!encryptedKey,
			encryptedKey: encryptedKey,
		}
	},
}
