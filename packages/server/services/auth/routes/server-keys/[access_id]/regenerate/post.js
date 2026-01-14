import { ServerKeys } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { access_id } = req.params
		const { user_id } = req.auth.session

		let serverKey = await ServerKeys.findOne({
			access_id: access_id,
			owner_user_id: user_id,
		}).select("+secret_token")

		if (!serverKey) {
			throw new OperationError(404, "Server key not found")
		}

		serverKey.secret_token = nanoid(36)

		await serverKey.save()

		return serverKey
	},
}
