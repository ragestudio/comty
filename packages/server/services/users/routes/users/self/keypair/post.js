import { UserDHKeyPair } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const { str } = req.body

		if (!str) {
			throw new Error("DH key pair string is missing `str:string`")
		}

		let record = await UserDHKeyPair.findOne({
			user_id: userId,
		})

		if (record) {
			throw new OperationError(400, "DH key pair already exists")
		}

		record = await UserDHKeyPair.create({
			user_id: userId,
			str: str,
		})

		return record
	},
}
