import SessionModel from "@db/auth_session"

export default async function (user_id) {
	return await SessionModel.find(
		{
			user_id: user_id,
		},
		{
			allow_filtering: true,
			raw: true,
		},
	)
}
