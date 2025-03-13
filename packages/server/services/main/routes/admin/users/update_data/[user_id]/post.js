import { User } from "@db_models"

const filterKeys = ["_id", "__v", "password"]

export default {
	middlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req, res) => {
		const targetUserId = req.params.user_id

		let user = await User.findById(targetUserId).catch((err) => {
			return false
		})

		if (!user) {
			throw new OperationError(400, "User not found")
		}

		user = user.toObject()

		const updateKeys = Object.keys(req.body.update)

		updateKeys.forEach((key) => {
			user[key] = req.body.update[key]
		})

		const updatedData = Object.keys(user)
			.filter((key) => !filterKeys.includes(key))
			.reduce((acc, key) => {
				acc[key] = user[key]
				return acc
			}, {})

		console.log(updatedData)

		await User.findByIdAndUpdate(targetUserId, updatedData)

		return user
	},
}
