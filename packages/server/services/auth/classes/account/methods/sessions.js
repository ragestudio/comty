import { Session } from "@db_models"

export default async (payload = {}) => {
	const { user_id } = payload

	if (!user_id) {
		throw new OperationError(400, "user_id not provided")
	}

	const sessions = await Session.find({ user_id }).sort({
		created_at: -1,
	})

	return sessions
}
