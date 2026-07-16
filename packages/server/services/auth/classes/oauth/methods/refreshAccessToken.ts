import AuthToken from "@shared-classes/AuthToken"
import { parseExpiresIn } from "../utils"

export default async function (refreshToken: string) {
	const result = await AuthToken.jwtVerify(refreshToken)

	if (result.error) {
		throw new Error("invalid_grant")
	}

	const data = result.data

	if (data.type !== "oauth_refresh") {
		throw new Error("invalid_grant")
	}

	const newAccessToken = await AuthToken.signToken(
		{
			user_id: data.user_id,
			client_id: data.client_id,
			scope: data.scope,
			type: "oauth_access",
		},
		"authStrategy",
	)

	return {
		access_token: newAccessToken,
		token_type: "Bearer",
		expires_in: parseExpiresIn(AuthToken.authStrategy.expiresIn),
		scope: data.scope,
	}
}
