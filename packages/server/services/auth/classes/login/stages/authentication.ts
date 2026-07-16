import { LoginStage, LoginContext } from "../processor"
import PasswordHash from "@db_models/passwordHash"
import bcrypt from "bcrypt"

export default class AuthenticationStage extends LoginStage {
	async execute(context: LoginContext): Promise<void> {
		const { password } = context.payload
		const { user } = context

		if (!password) {
			throw new OperationError(400, "Missing password")
		}

		const passwordHash = await PasswordHash.findOne({
			user_id: user._id.toString(),
		})

		if (!passwordHash) {
			throw new OperationError(401, "Invalid credentials")
		}

		if (!bcrypt.compareSync(password, passwordHash.hash)) {
			throw new OperationError(401, "Invalid credentials")
		}
	}
}
