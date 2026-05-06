import SessionModel from "@db/auth_session"

export default async function (user_id) {
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
