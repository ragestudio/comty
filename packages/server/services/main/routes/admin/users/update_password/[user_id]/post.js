import { User } from "@db_models"

import bcrypt from "bcrypt"

export default {
	middlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req, res) => {
		const { password } = req.body

		if (!password) {
			throw new OperationError(400, "Missing password")
		}

		const { user_id } = req.params

		const user = await User.findById(user_id).select("+password")

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		// hash the password
		const hash = bcrypt.hashSync(
			password,
			parseInt(process.env.BCRYPT_ROUNDS ?? 3),
		)

		user.password = hash

		await user.save()

		return {
			status: "ok",
			message: "Password updated successfully",
		}
	},
}
