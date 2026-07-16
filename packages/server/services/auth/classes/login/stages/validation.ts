import { LoginStage, LoginContext } from "../processor"
import TosViolations from "@db_models/tosViolations"

export default class AccountValidationStage extends LoginStage {
	async execute(context: LoginContext): Promise<void> {
		const { user } = context
		const user_id = user._id.toString()

		// check activation
		if (user.activated === false) {
			context.result = {
				code: user.email,
				user_id: user_id,
				activation_required: true,
			}
			context.isFinished = true
			return
		}

		// check disabled status
		if (user.disabled === true) {
			throw new OperationError(401, "User is disabled")
		}

		// check bot status
		if (user.bot === true) {
			throw new OperationError(401, "Bots cannot login")
		}

		// check TOS violations
		const violation = await TosViolations.findOne({ user_id })

		if (violation) {
			throw new OperationError(403, "Terms of service violated")
		}
	}
}
