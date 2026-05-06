import SessionModel from "@db/auth_session"

export default async function (session_id) {
	return await SessionModel.findOne(
		{
			_id: session_id,
		},
		{
			raw: true,
		},
	)
}
