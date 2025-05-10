import { UserChat } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const current_user_id = req.auth.session.user_id
		const target_user_id = req.params.to_user_id

		const { encryptedKey } = req.body

		if (!encryptedKey) {
			throw new OperationError(400, "Encrypted key is required")
		}

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
			chat = await UserChat.create({
				user_1: {
					_id: current_user_id,
					key: encryptedKey,
				},
				user_2: {
					_id: target_user_id,
					key: null,
				},
				started_at: new Date().getTime(),
				updated_at: new Date().getTime(),
			})
		} else {
			chat = chat.toObject()

			if (chat.user_1._id === current_user_id) {
				console.log(
					`User: ${current_user_id}, updating their key, slot 1`,
				)

				chat.user_1.key = encryptedKey
			}

			if (chat.user_2._id === current_user_id) {
				console.log(
					`User: ${current_user_id}, updating their key, slot 2`,
				)

				chat.user_2.key = encryptedKey
			}

			chat.updated_at = new Date().getTime()

			await UserChat.findByIdAndUpdate(chat._id, chat)
		}

		return {
			success: true,
			message: "Encryption key saved successfully",
		}
	},
}
