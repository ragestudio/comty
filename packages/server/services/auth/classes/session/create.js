import AuthToken from "@shared-classes/AuthToken"

export default async function (payload) {
	// generate a new session id
	const session_id = nanoid()

	// create a new Session obj
	const session = new this.Model({
		_id: session_id,
		user_id: payload.user_id,
		sign_location: payload.sign_location,
		ip_address: payload.ip_address,
		client: payload.client,
		created_at: new Date().getTime(),
	})

	// create and sign a new auth token
	const signedAuthToken = await AuthToken.signToken(
		{
			...payload,
			session_id: session_id,
		},
		"authStrategy",
	)

	const signedRefreshToken = await AuthToken.signToken(
		{
			...payload,
			session_id: session_id,
		},
		"refreshStrategy",
	)

	// set the auth token on the session
	session.token = signedAuthToken

	// save the session
	await session.saveAsync()

	return {
		data: session.toJSON(),
		authToken: signedAuthToken,
		refreshToken: signedRefreshToken,
		expiresIn: AuthToken.authStrategy.expiresIn,
	}
}
