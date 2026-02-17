export default async function (user_id) {
	const sessions = await this.Model.findAsync(
		{
			user_id: user_id,
		},
		{
			allow_filtering: true,
		},
	)

	for await (const session of sessions) {
		await session.deleteAsync()
	}

	return sessions.length
}
