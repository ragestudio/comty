import { User, ActivationCode } from "@db_models"

// set waiting time to 1 minute
const waitingTime = 60 * 1000

export default async (user_id, event = "account:activation") => {
	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const user = await User.findOne({
		_id: user_id,
	}).select("+email")

	if (!user) {
		throw new OperationError(404, "User not found")
	}

	if (user.activated) {
		throw new OperationError(400, "User already activated")
	}

	let activationCode = await ActivationCode.findOne({
		user_id: user._id,
	})

	if (activationCode) {
		// check if activation code is too recent
		if (
			activationCode.date.getTime() + waitingTime >
			new Date().getTime()
		) {
			throw new OperationError(
				400,
				"Activation code timeout, please try again later",
			)
		}

		await ActivationCode.deleteOne({
			user_id: user._id.toString(),
		})
	}

	activationCode = await ActivationCode.create({
		event: event,
		user_id: user._id.toString(),
		code: Math.floor(Math.random() * 900000) + 100000,
		date: new Date(),
	})

	global.ipc.invoke("ems", "account:activation:send", {
		activation_code: activationCode.code,
		user: user.toObject(),
	})

	return activationCode.toObject()
}
