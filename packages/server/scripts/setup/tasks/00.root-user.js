import User from "@db_models/user"
import PasswordHash from "@db_models/passwordHash"
import bcrypt from "bcrypt"

export default {
	description: "Create first root user",
	fn: async () => {
		// check if any user with includes admin role exists
		const adminUser = await User.find({
			$or: [{ roles: { $in: ["admin"] } }],
		})

		if (adminUser.length > 0) {
			console.log("Admin user already exists")
			return null
		}

		const defaultUsername = "root"
		const defaultPwd = "changemeorgethacked"
		const hash = await bcrypt.hash(defaultPwd, 6)

		let user = new User({
			username: defaultUsername,
			password: hash,
			email: "example@comty.app",
			roles: ["admin"],
			created_at: new Date().getTime(),
			accept_tos: true,
			activated: true,
		})

		await user.save()

		try {
			await PasswordHash.create({
				user_id: user._id.toString(),
				hash,
			})
		} catch (error) {
			await User.deleteOne({ _id: user._id })
			throw error
		}

		console.log(
			`Root user created. Username: ${defaultUsername}, password: ${defaultPwd}\nPlease change the password after first login!!.`,
		)

		return null
	},
	crashOnError: true,
}
