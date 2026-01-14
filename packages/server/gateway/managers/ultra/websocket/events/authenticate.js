import handleAuth from "../handlers/handleAuth"

export default async function (ws, payload) {
	const result = await handleAuth.bind(this)({
		token: `Bearer ${payload.data}`,
	})

	if (!result) {
		return ws.send(
			this.codec.encode({
				event: "user:unauthorized",
				data: {
					message: "Cannot validate the token",
				},
			}),
		)
	}

	ws.token = payload.data
	ws.session = result.session
	ws.user = result.user

	return ws.send(
		this.codec.encode({
			event: "user:authed",
			data: {
				user_id: ws.session.user_id,
			},
		}),
	)
}
