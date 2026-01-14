import { ServerKeys } from "@db_models"
import crypto from "crypto"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const user_id = req.auth.session.user_id

		const access_id = crypto.randomUUID()
		const secret = nanoid(36)

		const serverKey = new ServerKeys({
			name: req.body.name,
			access_id: access_id,
			secret_token: secret,
			access: ["readWrite"],
			owner_user_id: user_id,
			created_at: new Date().getTime(),
		})

		await serverKey.save()

		return serverKey
	},
}
