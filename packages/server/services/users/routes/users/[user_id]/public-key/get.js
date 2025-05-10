import { UserPublicKey } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const targetUserId = req.params.user_id

		const publicKeyRecord = await UserPublicKey.findOne({
			user_id: targetUserId,
		})

		if (!publicKeyRecord) {
			return {
				exists: false,
				public_key: null,
			}
		}

		return {
			exists: true,
			public_key: publicKeyRecord.public_key,
		}
	},
}
