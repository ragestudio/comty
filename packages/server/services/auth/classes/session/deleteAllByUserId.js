import SessionModel from "@db/auth_session"

export default async function (user_id) {
	if (!user_id) {
		throw new OperationError(400, "User ID is required")
	}

	const sessions = await SessionModel.find(
		{
			user_id: user_id,
		},
		{
			allow_filtering: true,
		},
	)

	for await (const session of sessions) {
		await session.delete()
	}

	return sessions.length
}
