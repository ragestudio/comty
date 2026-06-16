import AuthToken from "@shared-classes/AuthToken"

import SessionModel from "@db/auth_session"
import UserSessionModel from "@db/user_sessions"

import type { Batch } from "@ragestudio/scylla-odm"

export default async function (payload) {
	// generate a new session id
	const session_id = global.nanoid()

	// create a new Session obj
	const session = {
		_id: session_id,
		user_id: payload.user_id,
		sign_location: payload.sign_location,
		ip_address: payload.ip_address,
		client: payload.client,
		created_at: new Date(),
		token: null,
	}

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

	// set the token on the session
	session.token = signedAuthToken

	const batchOp = global.scylla.batch() as Batch

	// insert the session into the auth_sessions table
	SessionModel.batch.insert(batchOp, session)

	// insert the session into the user_sessions table
	UserSessionModel.batch.insert(batchOp, {
		user_id: payload.user_id,
		session_id: session_id,
	})

	// execute the batch operation
	await batchOp.execute()

	return {
		data: session,
		authToken: signedAuthToken,
		refreshToken: signedRefreshToken,
		expiresIn: AuthToken.authStrategy.expiresIn,
	}
}
