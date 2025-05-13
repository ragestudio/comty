import { User } from "@db_models"
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
			return true
		}

		const defaultUsername = "root"
		const defaultPwd = "changemeorgethacked"

		let user = new User({
			username: defaultUsername,
			password: await bcrypt.hash(defaultPwd, 6),
			email: "example@comty.app",
			roles: ["admin"],
			created_at: new Date().getTime(),
			accept_tos: true,
			activated: true,
		})

		await user.save()

		console.log(
			`Root user created. Username: ${defaultUsername}, password: ${defaultPwd}\nPlease change the password after first login!!.`,
		)

		return true
	},
	crashOnFail: true,
}
