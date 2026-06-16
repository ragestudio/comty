import { LoginStage, LoginContext } from "../processor"
import User from "@db_models/user"

export default class IdentificationStage extends LoginStage {
	async execute(context: LoginContext): Promise<void> {
		const { username } = context.payload

		if (!username) {
			throw new OperationError(400, "Missing username or email")
		}

		const isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
		const query = isEmail ? { email: username } : { username: username }

		const user = await User.findOne(query).select("+email +password")

		if (!user) {
			throw new OperationError(401, "User not found")
		}

		context.user = user
	}
}
