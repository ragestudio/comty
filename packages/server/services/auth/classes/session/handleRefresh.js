import AuthToken from "@shared-classes/AuthToken"

export default async function (req) {
	if (!req.body.refreshToken || !req.body.authToken) {
		throw new OperationError(400, "Missing refreshToken or/and authToken")
	}

	const validation = await AuthToken.jwtVerify(req.body.refreshToken)

	if (validation.error) {
		throw new OperationError(401, validation.error.message)
	}

	if (!validation.data.user_id) {
		throw new OperationError(401, "Invalid refresh token format")
	}

	let session = await this.Model.findOneAsync(
		{
			_id: validation.data.session_id,
			user_id: validation.data.user_id,
		},
		{ raw: true },
	)

	// check if session not found
	if (!session) {
		throw new OperationError(401, "Session not found or not valid")
	}

	// check if match the token
	if (session.token !== req.body.authToken) {
		throw new OperationError(401, "authToken not match with the session")
	}

	delete validation.data.exp
	delete validation.data.iat

	const newAuthToken = await AuthToken.signToken(
		{
			...validation.data,
			session_id: session._id.toString(),
		},
		"authStrategy",
	)

	const newRefreshToken = await AuthToken.signToken(
		validation.data,
		"refreshStrategy",
	)

	// update session token
	await this.Model.updateAsync(
		{
			_id: session._id.toString(),
			user_id: session.user_id,
		},
		{
			token: newAuthToken,
		},
	)

	return {
		token: newAuthToken,
		refreshToken: newRefreshToken,
		expiresIn: AuthToken.authStrategy.expiresIn,
	}
}
